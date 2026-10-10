// External Module
const express = require("express");
const userRouter = express.Router();
//local module
const homeControllers = require("../controllers/store-homes");

// Local Module



userRouter.get("/", homeControllers.getindex);
userRouter.get("/home", homeControllers.gethomes);
userRouter.get("/store/favourites", homeControllers.getfavtours);
userRouter.post("/store/favourites", homeControllers.postfavtours);
userRouter.get("/store/booking",homeControllers.getbooking);
userRouter.get("/store/reserves",homeControllers.getreserves);

userRouter.get("/home/:homeid",homeControllers.getdetails)
userRouter.post("/store/favourites/delete/:homeid",homeControllers.postremovefav)



module.exports = userRouter;
