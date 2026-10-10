
const Home = require("../models/home");
const User = require("../models/user");

// Get all homes
exports.gethomes = async (req, res, next) => {
  try {
    const homes = await Home.find();

    return res.status(200).json({
      homes,
      pagetitle: "home-list",
      isLoggedin: Boolean(req.session?.user),
      user: req.session?.user || null,
    });
  } catch (error) {
    next(error);
  }
};

// Get homepage data
exports.getindex = async (req, res, next) => {
  try {
    const homes = await Home.find();

    return res.status(200).json({
      homes,
      pagetitle: "home-page",
      isLoggedin: Boolean(req.session?.user),
      user: req.session?.user || null,
    });
  } catch (error) {
    next(error);
  }
};

// Get the logged-in user's favourites
exports.getfavtours = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to view your favourites.",
      });
    }

    const user = await User.findById(userId).populate("favourites");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      favourites: user.favourites,
      pagetitle: "favourites",
      isLoggedin: true,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// Add a home to favourites
exports.postfavtours = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;
    const homeId = req.body?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to save favourites.",
      });
    }

    if (!homeId) {
      return res.status(400).json({
        message: "Home ID is required.",
      });
    }

    const [user, home] = await Promise.all([
      User.findById(userId),
      Home.findById(homeId),
    ]);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!home) {
      return res.status(404).json({
        message: "Home not found.",
      });
    }

    const alreadyFavourite = user.favourites.some(
      (favourite) => favourite.toString() === homeId
    );

    if (!alreadyFavourite) {
      user.favourites.push(home._id);
      await user.save();
    }

    return res.status(200).json({
      message: "Home added to favourites.",
      favourites: user.favourites,
    });
  } catch (error) {
    next(error);
  }
};

// Get booking-page data
exports.getbooking = async (req, res, next) => {
  try {
    const homes = await Home.find();

    return res.status(200).json({
      homes,
      pagetitle: "booking-page",
    });
  } catch (error) {
    next(error);
  }
};

// Get reservation-page data
exports.getreserves = async (req, res, next) => {
  try {
    const homes = await Home.find();

    return res.status(200).json({
      homes,
      pagetitle: "reservation-page",
    });
  } catch (error) {
    next(error);
  }
};

// Get a single home's details
exports.getdetails = async (req, res, next) => {
  try {
    const homeId = req.params.homeid;

    if (!homeId) {
      return res.status(400).json({
        message: "Home ID is required.",
      });
    }

    const home = await Home.findById(homeId);

    if (!home) {
      return res.status(404).json({
        message: "Home not found.",
      });
    }

    return res.status(200).json({
      home,
      pagetitle: "home-details-page",
      isLoggedin: Boolean(req.session?.user),
      user: req.session?.user || null,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid home ID.",
      });
    }

    next(error);
  }
};

// Remove a home from favourites
exports.postremovefav = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;
    const homeId = req.params.homeid;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to manage favourites.",
      });
    }

    if (!homeId) {
      return res.status(400).json({
        message: "Home ID is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.favourites = user.favourites.filter(
      (favourite) => favourite.toString() !== homeId
    );

    await user.save();

    return res.status(200).json({
      message: "Home removed from favourites.",
      favourites: user.favourites,
    });
  } catch (error) {
    next(error);
  }
};
