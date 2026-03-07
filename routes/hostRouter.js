// External Module
const express = require("express");
const hostRouter = express.Router();

// Local Module
const homeControllers = require("../controllers/host-homes");

hostRouter.get("/add-home", homeControllers.getaddhome);

hostRouter.post("/add-home", homeControllers.postaddhome);
hostRouter.get("/host-home-list",homeControllers.gethosthomes)
hostRouter.get("/edit-Home/:homeid",homeControllers.getedithome)
hostRouter.post("/edit-Home",homeControllers.postedithome);
hostRouter.post("/delete-home/:homeid",homeControllers.postdeletehome)

exports.hostRouter = hostRouter;
