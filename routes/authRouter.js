// External Module
const express = require("express");
const authRouter = express.Router();
//local module
const authControllers = require("../controllers/authcontroler");


authRouter.get("/login", authControllers.getlogin);
authRouter.post("/login", authControllers.postlogin);
authRouter.post("/logout",authControllers.postlogout);
authRouter.get('/signup',authControllers.getsignup);
authRouter.post('/signup',authControllers.postsignup);




module.exports =authRouter;