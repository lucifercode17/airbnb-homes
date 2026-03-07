// Core Module
require('dotenv').config()
const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');
const mongodbstore =require('connect-mongodb-session')(session);
const multer =require('multer');

const { default: mongoose } = require('mongoose');

//Local Module
const userRouter = require("./routes/userRouter")
const {hostRouter} = require("./routes/hostRouter")
const rootDir = require("./utils/pathUtil");
const errorcontroller = require('./controllers/error');

const authRouter =require('./routes/authRouter');

const PORT = process.env.PORT || 3000;
const db_path = process.env.MONGO_URI;


const app = express();
app.set('view engine' , 'ejs');
app.set('views', 'views');


const randomString = (length) =>{
  const characters ='abcdefghijklmnopqrstuvwxyz';
  let result ='';
  for(let i =0;i< length;i++){
    result += characters.charAt(Math.random()*characters.length)
  }
  return result;
}

const storage =multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null,"uploads/");
  },
  filename:(req,file,cb) =>{
    cb(null,randomString(10) + '-'+file.originalname);
  }
})


const fileFilter = (req,file,cb) => {
  if(['image/jpeg','image/png','image/jpg'].includes(file.mimetype)){
    cb(null,true);

  }
  else{
    cb(null,false);
  }
}
const multeroption ={
  storage:storage,fileFilter:fileFilter
};








app.use(multer(multeroption).single('photo'));
app.use(express.static("public"));
app.use(express.static(path.join(rootDir,'public')));
app.use("/uploads",express.static(path.join(rootDir,"uploads")))
app.use("/host/uploads",express.static(path.join(rootDir,"uploads")))
app.use("/home/uploads",express.static(path.join(rootDir,"uploads")))
app.use("/store/uploads",express.static(path.join(rootDir,"uploads")))


app.use(express.urlencoded());
const store = new mongodbstore({
  uri:db_path,
  collection:'sessions'
});

app.use(session({
  secret:'airbnb pdemo project',
  resave:false,
  saveUninitialized:true,
  store:store
}));



app.use((req,res,next)=>{
  req.isLoggedin =req.session.isLoggedin;
  next();

})
app.use(userRouter);
app.use(authRouter);
app.use("/host",(req,res,next)=>{
  if(req.isLoggedin){
    next();
  }else{
    res.redirect("/login")
    
  }
})
app.use("/host", hostRouter);

app.use(errorcontroller.errorhandle)






mongoose.connect(db_path)
.then(() => {
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

})
.catch((err) => {
  console.log("Error while connecting to MongoDB:", err);
});