const express = require("express");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Home = require("../models/home");
const User = require("../models/user");
const { cloudinary, upload } = require("../config/cloudinary");

const router = express.Router();

const publicUser = (user) =>
  user
    ? {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname || "",
        email: user.email,
        role: user.role,
      }
    : null;

const photoUrl = (photo) => {
  if (!photo) return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  return "/" + photo.replace(/\\/g, "/").replace(/^\.\//, "");
};

const serializeHome = (home) => {
  const item = home?.toObject ? home.toObject() : home;
  if (!item) return null;
  return {
    ...item,
    photo: photoUrl(item.photo),
    host: item.host && item.host.firstname ? publicUser(item.host) : item.host,
  };
};

const requireLogin = (req, res, next) => {
  if (req.session?.user?._id) return next();
  return res.status(401).json({ message: "Please log in to continue." });
};

const requireHost = (req, res, next) => {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: "Please log in to continue." });
  }
  if (req.session.user.role !== "host") {
    return res.status(403).json({ message: "Host access is required." });
  }
  next();
};

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/auth/me", (req, res) => {
  res.json({
    user: publicUser(req.session?.user),
    isLoggedIn: Boolean(req.session?.user),
  });
});

router.post(
  "/auth/signup",
  [
    check("firstname")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters.")
      .matches(/^[A-Za-z]+$/)
      .withMessage("First name must contain letters only."),
    check("lastname")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[A-Za-z]+$/)
      .withMessage("Last name must contain letters only."),
    check("email")
      .isEmail()
      .withMessage("Enter a valid email address.")
      .normalizeEmail(),
    check("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters.")
      .matches(/[A-Z]/)
      .withMessage("Password needs an uppercase letter.")
      .matches(/[a-z]/)
      .withMessage("Password needs a lowercase letter.")
      .matches(/[0-9]/)
      .withMessage("Password needs a number.")
      .matches(/[!@&]/)
      .withMessage("Password needs one special character: !, @ or &."),
    check("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match."),
    check("role")
      .isIn(["host", "user"])
      .withMessage("Choose user or host account."),
  ],
  asyncRoute(async (req, res) => {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(422).json({
        message: "Please correct the form.",
        errors: validation.array().map((error) => error.msg),
      });
    }

    const { firstname, lastname, email, password, role } = req.body;
    if (await User.findOne({ email })) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      firstname: firstname.trim(),
      lastname: (lastname || "").trim(),
      email,
      password: await bcrypt.hash(password, 12),
      role,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: publicUser(user),
    });
  }),
);

router.post(
  "/auth/login",
  asyncRoute(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: String(email || "").toLowerCase(),
    });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) return next(sessionError);
      req.session.user = publicUser(user);
      req.session.isLoggedin = true;
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.json({
          message: "Logged in successfully.",
          user: publicUser(user),
        });
      });
    });
  }),
);

router.post("/auth/logout", (req, res, next) => {
  if (!req.session) return res.json({ message: "Logged out." });
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("airbnb.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ message: "Logged out." });
  });
});

router.get(
  "/homes",
  asyncRoute(async (req, res) => {
    const homes = await Home.find().sort({ _id: -1 });
    res.json({ homes: homes.map(serializeHome) });
  }),
);

router.get(
  "/homes/:id",
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(404).json({ message: "Property not found." });
    const home = await Home.findById(req.params.id).populate(
      "host",
      "firstname lastname email role",
    );
    if (!home) return res.status(404).json({ message: "Property not found." });
    res.json({ home: serializeHome(home) });
  }),
);

router.get(
  "/favourites",
  requireLogin,
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.session.user._id).populate(
      "favourites",
    );
    const homes = (user?.favourites || []).filter(Boolean).map(serializeHome);
    res.json({ homes });
  }),
);

router.post(
  "/favourites/:id",
  requireLogin,
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(404).json({ message: "Property not found." });
    const home = await Home.findById(req.params.id);
    if (!home) return res.status(404).json({ message: "Property not found." });

    const user = await User.findById(req.session.user._id);
    if (!user)
      return res.status(401).json({ message: "Please log in to continue." });
    const exists = user.favourites.some(
      (id) => id.toString() === req.params.id,
    );
    if (exists) user.favourites.pull(req.params.id);
    else user.favourites.push(req.params.id);
    await user.save();

    res.json({
      isFavourite: !exists,
      message: exists ? "Removed from favourites." : "Added to favourites.",
    });
  }),
);

router.delete(
  "/favourites/:id",
  requireLogin,
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(404).json({ message: "Property not found." });
    await User.findByIdAndUpdate(req.session.user._id, {
      $pull: { favourites: req.params.id },
    });
    res.json({ message: "Removed from favourites." });
  }),
);

router.get(
  "/host/homes",
  requireHost,
  asyncRoute(async (req, res) => {
    const homes = await Home.find({ host: req.session.user._id }).sort({
      _id: -1,
    });
    res.json({ homes: homes.map(serializeHome) });
  }),
);

router.post(
  "/host/homes",
  requireHost,
  upload.single("photo"),
  asyncRoute(async (req, res) => {
    const { houseName, price, location, rating, description } = req.body;
    if (
      !houseName?.trim() ||
      price === undefined ||
      !location?.trim() ||
      rating === undefined
    ) {
      return res
        .status(422)
        .json({ message: "Name, price, location and rating are required." });
    }
    if (!req.file?.path) {
      return res
        .status(422)
        .json({ message: "Please upload a JPG, PNG, or WebP property photo." });
    }

    const numericPrice = Number(price);
    const numericRating = Number(rating);
    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isFinite(numericRating) ||
      numericRating < 0 ||
      numericRating > 5
    ) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      return res
        .status(422)
        .json({ message: "Enter a valid price and rating between 0 and 5." });
    }

    try {
      const home = await Home.create({
        houseName: houseName.trim(),
        price: numericPrice,
        location: location.trim(),
        rating: numericRating,
        description: description || "",
        photo: req.file.path,
        photoPublicId: req.file.filename,
        host: req.session.user._id,
      });
      return res
        .status(201)
        .json({ message: "Property added.", home: serializeHome(home) });
    } catch (error) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      throw error;
    }
  }),
);

router.put(
  "/host/homes/:id",
  requireHost,
  upload.single("photo"),
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(404).json({ message: "Property not found." });
    const home = await Home.findOne({
      _id: req.params.id,
      host: req.session.user._id,
    });
    if (!home) {
      if (req.file?.filename)
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      return res
        .status(404)
        .json({ message: "Property not found or you do not own it." });
    }

    const oldPublicId = home.photoPublicId;
    const { houseName, price, location, rating, description } = req.body;
    if (houseName !== undefined) home.houseName = String(houseName).trim();
    if (price !== undefined) home.price = Number(price);
    if (location !== undefined) home.location = String(location).trim();
    if (rating !== undefined) home.rating = Number(rating);
    if (description !== undefined) home.description = description;

    if (
      !Number.isFinite(Number(home.price)) ||
      Number(home.price) < 0 ||
      !Number.isFinite(Number(home.rating)) ||
      Number(home.rating) < 0 ||
      Number(home.rating) > 5
    ) {
      if (req.file?.filename)
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      return res
        .status(422)
        .json({ message: "Enter a valid price and rating between 0 and 5." });
    }

    if (req.file?.path) {
      home.photo = req.file.path;
      home.photoPublicId = req.file.filename;
    }

    try {
      await home.save();
    } catch (error) {
      if (req.file?.filename)
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      throw error;
    }

    if (req.file && oldPublicId && oldPublicId !== req.file.filename) {
      await cloudinary.uploader
        .destroy(oldPublicId)
        .catch((error) =>
          console.error(
            "Could not remove replaced Cloudinary image:",
            error.message,
          ),
        );
    }
    res.json({ message: "Property updated.", home: serializeHome(home) });
  }),
);

router.delete(
  "/host/homes/:id",
  requireHost,
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(404).json({ message: "Property not found." });
    const home = await Home.findOneAndDelete({
      _id: req.params.id,
      host: req.session.user._id,
    });
    if (!home)
      return res
        .status(404)
        .json({ message: "Property not found or you do not own it." });

    await User.updateMany(
      { favourites: req.params.id },
      { $pull: { favourites: req.params.id } },
    );
    if (home.photoPublicId) {
      await cloudinary.uploader
        .destroy(home.photoPublicId)
        .catch((error) =>
          console.error("Could not remove Cloudinary image:", error.message),
        );
    }
    res.json({ message: "Property deleted." });
  }),
);

router.use((err, req, res, next) => {
  console.error("API error:", err);
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  return res.status(status).json({
    message:
      status === 500 ? "Something went wrong on the server." : err.message,
  });
});

module.exports = router;
