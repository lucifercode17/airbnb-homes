const Home = require("../models/home");
const User = require("../models/user");
const { cloudinary } = require("../config/cloudinary");

exports.getaddhome = (req, res) => {
  res.render("host/editHome", {
    pagetitle: "add-home",
    editing: false,
    isLoggedin: req.isLoggedin,
    user: req.session.user,
  });
};

exports.postaddhome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;
    if (!req.file?.path) {
      return res.status(422).send("Please upload a JPG, PNG, or WebP image.");
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

    return res.redirect("/host/host-home-list");
  } catch (error) {
    if (req.file?.filename) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return next(error);
  }
};

exports.gethosthomes = async (req, res, next) => {
  try {
    const homes = await Home.find({ host: req.session.user._id }).sort({ _id: -1 });
    return res.render("host/host-home-list", {
      houseregester: homes,
      pagetitle: "host-home-list",
      isLoggedin: req.isLoggedin,
      user: req.session.user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getedithome = async (req, res, next) => {
  try {
    const home = await Home.findOne({
      _id: req.params.homeid,
      host: req.session.user._id,
    });
    if (!home) return res.redirect("/host/host-home-list");
    return res.render("host/editHome", {
      pagetitle: "edit page",
      editing: true,
      home,
      isLoggedin: req.isLoggedin,
      user: req.session.user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.postedithome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description, _id } = req.body;
    const home = await Home.findOne({ _id, host: req.session.user._id });
    if (!home) {
      if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      return res.status(404).send("Home not found or you do not own it.");
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
      if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      throw error;
    }

    if (req.file && oldPublicId && oldPublicId !== req.file.filename) {
      await cloudinary.uploader.destroy(oldPublicId).catch((error) =>
        console.error("Could not remove replaced Cloudinary image:", error.message)
      );
    }
    return res.redirect("/host/host-home-list");
  } catch (error) {
    return next(error);
  }
};

exports.postdeletehome = async (req, res, next) => {
  try {
    const home = await Home.findOneAndDelete({
      _id: req.params.homeid,
      host: req.session.user._id,
    });
    if (!home) return res.status(404).send("Home not found or you do not own it.");

    await User.updateMany(
      { favourites: home._id },
      { $pull: { favourites: home._id } }
    );

    if (home.photoPublicId) {
      await cloudinary.uploader.destroy(home.photoPublicId).catch((error) =>
        console.error("Could not remove Cloudinary image:", error.message)
      );
    }
    return res.redirect("/host/host-home-list");
  } catch (error) {
    return next(error);
  }
};
