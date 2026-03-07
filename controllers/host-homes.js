const Home = require("../models/home");
const User = require("../models/user");
const fs = require("fs")

exports.getaddhome = (req, res, next) => {
  res.render("host/editHome", {
    pagetitle: "add-home",
    editing: false,
    isLoggedin: req.isLoggedin,
    user:req.session.user,
  });
};

exports.postaddhome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description } = req.body;

    if (!req.file) {
      return res.status(422).send("No image received");
    }

    const photo = req.file.path;

    const home = new Home({
      houseName,
      price,
      location,
      photo,
      rating,
      description,
      host: req.session.user._id   // 🔥 VERY IMPORTANT
    });

    await home.save();

    console.log("Home saved successfully");
    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log(err);
  }
};


exports.gethosthomes = (req, res, next) => {

  Home.find({ host: req.session.user._id })
    .then((houseregester) => {

      res.render("host/host-home-list", {
        houseregester: houseregester,
        pagetitle: "host-home-list",
        isLoggedin: req.isLoggedin,
        user: req.session.user,
      });

    })
    .catch(err => console.log(err));
};

exports.getedithome = (req, res, next) => {
  const homeid = req.params.homeid;
  const editing = req.query.editing === "true";

  Home.findById(homeid).then((home) => {
    if (!home) {
      console.log("there is no home exist");

      res.redirect("/host/host-home-list");
    }
    console.log(homeid, editing, home);
    res.render("host/editHome", {
      pagetitle: "edit page",
      editing: editing,
      home: home,
      isLoggedin: req.isLoggedin,
      user:req.session.user,
    });
  });
};
exports.postedithome = async (req, res, next) => {
  try {
    const { houseName, price, location, rating, description, _id } = req.body;

    const home = await Home.findById(_id);
    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;

    if (req.file) {
      fs.unlink(home.photo,(err) =>{
        if(err){
          console.log("error while deleting file ",err);
        }
      })
      home.photo = req.file.path;
    }

    await home.save();

    console.log("Home updated successfully");
    res.redirect("/host/host-home-list");

  } catch (err) {
    console.log("Error while updating:", err);
  }
};


exports.postdeletehome = async (req, res, next) => {
  try {
    const homeid = req.params.homeid;

    console.log("Deleting home:", homeid);

    // 1️⃣ Delete only if this home belongs to logged-in host
    const deletedHome = await Home.findOneAndDelete({
      _id: homeid,
      host: req.session.user._id
    });

    if (!deletedHome) {
      return res.status(403).send("Not authorized to delete this home");
    }

    // 2️⃣ Remove this home from all users' favourites
    await User.updateMany(
      { favourites: homeid },
      { $pull: { favourites: homeid } }
    );

    res.redirect("/host/host-home-list");

  } catch (error) {
    console.log("There is an error in deleting:", error);
  }
};