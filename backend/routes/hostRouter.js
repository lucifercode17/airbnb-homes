const express = require("express");
const hostRouter = express.Router();
const homeControllers = require("../controllers/host-homes");
const { upload } = require("../config/cloudinary");

hostRouter.get("/add-home", homeControllers.getaddhome);
hostRouter.post("/add-home", upload.single("photo"), homeControllers.postaddhome);
hostRouter.get("/host-home-list", homeControllers.gethosthomes);
hostRouter.get("/edit-Home/:homeid", homeControllers.getedithome);
hostRouter.post("/edit-Home", upload.single("photo"), homeControllers.postedithome);
hostRouter.post("/delete-home/:homeid", homeControllers.postdeletehome);

exports.hostRouter = hostRouter;
