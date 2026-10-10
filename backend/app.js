require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const cors = require("cors");

const userRouter = require("./routes/userRouter");
const { hostRouter } = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const apiRouter = require("./routes/apiRouter");
const rootDir = require("./utils/pathUtil");
const {errorhandle} = require("./controllers/error");
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI. Add your MongoDB connection string to .env.");
  process.exit(1);
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://airbnb-homes-one.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(rootDir, "public")));
app.use("/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/host/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/home/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/store/uploads", express.static(path.join(rootDir, "uploads")));
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Airbnb backend is running!",
    api: "/api",
  });
});

const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: "sessions",
});
store.on("error", (error) => console.error("Session store error:", error));
app.set("trust proxy", 1);

app.use(
  session({
    name: "airbnb.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use((req, res, next) => {
  req.isLoggedin = Boolean(req.session?.user);
  res.locals.isLoggedin = req.isLoggedin;
  res.locals.user = req.session?.user || null;
  next();
});

// React frontend API. Upload middleware is applied only on image routes.
app.use("/api", apiRouter);
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

// Legacy EJS routes remain available for compatibility.
app.use(userRouter);
app.use(authRouter);
app.use("/host", (req, res, next) => {
  if (!req.session?.user) {
    if (req.accepts("html")) return res.redirect("/login");
    return res.status(401).json({ message: "Please log in to continue." });
  }
  if (req.session.user.role !== "host") {
    return res.status(403).send("Host access is required.");
  }
  next();
});
app.use("/host", hostRouter);


app.use(errorhandle)
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  if (res.headersSent) return next(err);
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(err.status || 500).json({
      message: err.status === 400 ? err.message : "Something went wrong on the server.",
    });
  }
  return res.status(err.status || 500).send("Something went wrong on the server.");
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });
