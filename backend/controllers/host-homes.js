
const Home = require("../models/home");
const User = require("../models/user");
const { cloudinary } = require("../config/cloudinary");

// Get the add-home page data
exports.getaddhome = async (req, res, next) => {
  try {
    return res.status(200).json({
      pagetitle: "add-home",
      editing: false,
      isLoggedin: Boolean(req.session?.user),
      user: req.session?.user || null,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new home
exports.postaddhome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;

    if (!req.session?.user?._id) {
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }

      return res.status(401).json({
        message: "Please log in to add a property.",
      });
    }

    if (!req.file?.path) {
      return res.status(422).json({
        message: "Please upload a JPG, PNG, or WebP image.",
      });
    }

    const home = await Home.create({
      houseName,
      price,
      location,
      photo: req.file.path,
      photoPublicId: req.file.filename,
      rating,
      description,
      host: req.session.user._id,
    });

    return res.status(201).json({
      message: "Home created successfully.",
      home,
    });
  } catch (error) {
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }

    return next(error);
  }
};

// Get homes owned by the logged-in host
exports.gethosthomes = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to view your properties.",
      });
    }

    const homes = await Home.find({ host: userId }).sort({ _id: -1 });

    return res.status(200).json({
      homes,
      pagetitle: "host-home-list",
      isLoggedin: true,
      user: req.session.user,
    });
  } catch (error) {
    return next(error);
  }
};

// Get one home for editing
exports.getedithome = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to edit a property.",
      });
    }

    const home = await Home.findOne({
      _id: req.params.homeid,
      host: userId,
    });

    if (!home) {
      return res.status(404).json({
        message: "Home not found or you do not own it.",
      });
    }

    return res.status(200).json({
      home,
      pagetitle: "edit page",
      editing: true,
      isLoggedin: true,
      user: req.session.user,
    });
  } catch (error) {
    return next(error);
  }
};

// Update a home
exports.postedithome = async (req, res, next) => {
  let newImagePublicId;

  try {
    const { houseName, price, location, rating, description } = req.body;
    const homeId = req.params.homeid || req.body._id;
    const userId = req.session?.user?._id;

    if (!userId) {
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }

      return res.status(401).json({
        message: "Please log in to edit a property.",
      });
    }

    newImagePublicId = req.file?.filename;

    const home = await Home.findOne({
      _id: homeId,
      host: userId,
    });

    if (!home) {
      if (newImagePublicId) {
        await cloudinary.uploader.destroy(newImagePublicId).catch(() => {});
      }

      return res.status(404).json({
        message: "Home not found or you do not own it.",
      });
    }

    const oldPublicId = home.photoPublicId;

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    if (req.file?.path) {
      home.photo = req.file.path;
      home.photoPublicId = req.file.filename;
    }

    try {
      await home.save();
    } catch (error) {
      if (newImagePublicId) {
        await cloudinary.uploader.destroy(newImagePublicId).catch(() => {});
      }

      newImagePublicId = null;
      throw error;
    }

    if (newImagePublicId && oldPublicId && oldPublicId !== newImagePublicId) {
      await cloudinary.uploader.destroy(oldPublicId).catch((error) => {
        console.error("Could not remove replaced Cloudinary image:", error.message);
      });
    }

    return res.status(200).json({
      message: "Home updated successfully.",
      home,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete a home
exports.postdeletehome = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to delete a property.",
      });
    }

    const home = await Home.findOneAndDelete({
      _id: req.params.homeid,
      host: userId,
    });

    if (!home) {
      return res.status(404).json({
        message: "Home not found or you do not own it.",
      });
    }

    await User.updateMany(
      { favourites: home._id },
      { $pull: { favourites: home._id } }
    );

    if (home.photoPublicId) {
      await cloudinary.uploader.destroy(home.photoPublicId).catch((error) => {
        console.error("Could not remove Cloudinary image:", error.message);
      });
    }

    return res.status(200).json({
      message: "Home deleted successfully.",
      homeId: home._id,
    });
  } catch (error) {
    return next(error);
  }
};
