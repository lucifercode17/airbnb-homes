
const Home = require("../models/home");
const User =require("../models/user")
exports.gethomes = (req, res, next) => {
  Home.find().then((houseregester) => {
    res.render("store/home-list", {
      houseregester: houseregester,
      pagetitle: "home-list",
      isLoggedin :req.isLoggedin,
      user:req.session.user,
    });
  });
};
exports.getindex = (req, res, next) => {
  Home.find().then((houseregester) => {
    res.render("store/home", {
      houseregester: houseregester,
      pagetitle: "home-page",
      isLoggedin :req.isLoggedin,
      user:req.session.user,
    });
  });
};
exports.getfavtours = async (req, res, next) => {
  const userId =req.session.user._id;
  const user =await User.findById(userId).populate('favourites');
  res.render("store/favourites",{
      favourites :user.favourites,
      pagetitle:"favourites",
      isLoggedin :req.isLoggedin,
      user :req.session.user
    });
 
  
};

exports.postfavtours = async (req, res, next) => {
  const homeid = req.body.id;
  const userid =req.session.user._id;
  const user = await User.findById(userid);
  if(!user.favourites.includes(homeid)){
    user.favourites.push(homeid);
    await user.save();

  }
  res.redirect("/store/favourites")


  

};

exports.getbooking = (req, res, next) => {
  Home.find().then((houseregester) => {
    res.render("store/booking", {
      houseregester: houseregester,
      pagetitle: "booking-page",
      isLoggedin :req.isLoggedin,
      user:req.session.user,
    });
  });
};
exports.getreserves = (req, res, next) => {
  Home.find().then((houseregester) => {
    res.render("store/reserves", {
      houseregester: houseregester,
      pagetitle: "reservation-page",
      isLoggedin :req.isLoggedin,
      user:req.session.user,
    });
  });
};
exports.getdetails = async (req, res, next) => {
  try {
    const homeid = req.params.homeid;

    const home = await Home.findById(homeid);

    if (!home) {
      return res.redirect("/home");
    }

    res.render("store/home-details", {
      pagetitle: "home-details-page",
      home,isLoggedin :req.isLoggedin,
      user:req.session.user,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};


exports.postremovefav = async (req, res, next) => {
  const homeid = req.params.homeid;
  console.log("deleting  home ", homeid);
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if(user.favourites.includes(homeid)){
    user.favourites =user.favourites.filter(fav => fav != homeid);
    await user.save();
  }
 
  res.redirect("/store/favourites");
};
