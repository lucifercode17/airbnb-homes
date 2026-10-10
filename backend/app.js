
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
const { errorhandle } = require("./controllers/error");

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable.");
  process.exit(1);
}

if (isProduction && !SESSION_SECRET) {
  console.error("Missing SESSION_SECRET environment variable.");
  process.exit(1);
}

if (isProduction) {
  app.set("trust proxy", 1);
}

// Keep EJS settings for legacy routes that still use views.
app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

// ---------------- CORS ----------------

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "https://airbnb-homes-one.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ---------------- Request parsing ----------------

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "1mb" }));

// ---------------- Static files ----------------

app.use(express.static(path.join(rootDir, "public")));
app.use("/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/host/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/home/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/store/uploads", express.static(path.join(rootDir, "uploads")));

// ---------------- Root health check ----------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Airbnb backend is running!",
    api: "/api",
  });
});

// ---------------- MongoDB session store ----------------

const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: "sessions",
});

store.on("error", (error) => {
  console.error("Session store error:", error);
});

app.use(
  session({
    name: "airbnb.sid",
    secret: SESSION_SECRET || "development-only-change-this-secret",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ---------------- Login state ----------------

app.use((req, res, next) => {
  req.isLoggedin = Boolean(req.session?.user);
  res.locals.isLoggedin = req.isLoggedin;
  res.locals.user = req.session?.user || null;
  next();
});

// ---------------- React API routes ----------------

app.use("/api", apiRouter);

// API 404 handler: only runs when no API route matched.
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    path: req.originalUrl,
  });
});

// ---------------- Legacy routes ----------------

app.use(userRouter);
app.use(authRouter);

app.use("/host", (req, res, next) => {
  if (!req.session?.user) {
    if (req.accepts("html")) {
      return res.redirect("/login");
    }

    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  if (req.session.user.role !== "host") {
    return res.status(403).json({
      success: false,
      message: "Host access is required.",
    });
  }

  next();
});

app.use("/host", hostRouter);

// ---------------- Global 404 handler ----------------

app.use(errorhandle);

// ---------------- Global error handler ----------------

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(err.status || 500).json({
      success: false,
      message:
        err.status && err.status < 500
          ? err.message
          : "Something went wrong on the server.",
    });
  }

  return res
    .status(err.status || 500)
    .send("Something went wrong on the server.");
});

// ---------------- Connect MongoDB and start server ----------------

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
 });