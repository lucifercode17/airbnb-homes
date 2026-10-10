
const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

// Get login page data
exports.getlogin = (req, res) => {
  return res.status(200).json({
    message: "Login endpoint ready",
    isLoggedin: Boolean(req.session?.user),
    user: req.session?.user || null,
  });
};

// Login
exports.postlogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(422).json({
        message: "User does not exist.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(422).json({
        message: "Invalid email or password.",
      });
    }

    req.session.user = user;
    req.session.isLoggedin = true;

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    return res.status(200).json({
      message: "Login successful.",
      isLoggedin: true,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
      redirectTo:
        user.role === "host" ? "/host/host-home-list" : "/",
    });
  } catch (error) {
    next(error);
  }
};

// Signup with validation
exports.postsignup = [
  check("firstname")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First name must contain at least 2 characters.")
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name must contain only letters."),

  check("lastname")
    .trim()
    .matches(/^[A-Za-z]+$/)
    .withMessage("Last name must contain only letters."),

  check("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email.")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 5 })
    .withMessage("Password must contain at least 5 characters.")
    .matches(/^[A-Z]/)
    .withMessage("Password must start with an uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number.")
    .matches(/[!@&]/)
    .withMessage("Password must contain at least one of !, @, or &."),

  check("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),

  check("role")
    .notEmpty()
    .withMessage("Please select a role.")
    .isIn(["host", "user"])
    .withMessage("Invalid user type."),

  async (req, res, next) => {
    try {
      const { firstname, lastname, email, password, role } = req.body;

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(422).json({
          message: "Please correct the validation errors.",
          errors: errors.array().map((error) => error.msg),
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          message: "An account with this email already exists.",
          errors: ["Email is already registered."],
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
      });

      return res.status(201).json({
        message: "Account created successfully.",
        user: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        },
        redirectTo: "/login",
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "An account with this email already exists.",
        });
      }

      next(error);
    }
  },
];

// Logout
exports.postlogout = (req, res, next) => {
  if (!req.session) {
    return res.status(200).json({
      message: "Logged out successfully.",
    });
  }

  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("connect.sid");

    return res.status(200).json({
      message: "Logged out successfully.",
      redirectTo: "/login",
    });
  });
};

// Get signup page data
exports.getsignup = (req, res) => {
  return res.status(200).json({
    message: "Signup endpoint ready",
    isLoggedin: Boolean(req.session?.user),
  });
};
