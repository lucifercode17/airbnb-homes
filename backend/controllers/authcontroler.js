const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt =require('bcryptjs');
const user = require("../models/user");

exports.getlogin = (req, res, next) => {
  res.render("auth/login", {
    pagetitle: "login",
    isLoggedin: false,
    errors :[],
    oldInput:{email:""},
    user:{},
  });
};

exports.postlogin =  async (req, res, next) => {
  const{email,password}= req.body;
  const user = await User.findOne({email:email});
  if(!user){
    return res.status(422).render('auth/login',{
      pagetitle:'login',
      isLoggedin:false,
      errors:['user doesnot exist'],
      oldInput:{email},
      user:{}
    });
  }
  const isMatch = await bcrypt.compare(password,user.password);
  if(!isMatch){
    return res.status(422).render('auth/login',{
      pagetitle:'login',
      isLoggedin:false,
      errors:['invalid password'],
      oldInput:{email},
      user:{}
    });
  }



  req.session.user =user;
  req.session.isLoggedin =true;
  await req.session.save(err => {
    if (err) console.log(err);

    // ✅ ROLE CHECK HERE
    if (user.role === "host") {
      return res.redirect("/host/host-home-list");   // host dashboard
    }

    // default: normal user
    res.redirect("/");            // user home/dashboard
  });


  
  
};

exports.postsignup = [
  check("firstname")
    .trim()
    .isLength({ min: 2 })
    .withMessage("frist name should be of 2 charaters")
    .matches(/^[A-Za-z]+$/)
    .withMessage("fist name should contain only alphabets"),

  check("lastname")
    .trim()
    .matches(/^[A-Za-z]+$/)
    .withMessage("last name should be contain only alphabets"),

  check("email")
    .isEmail()
    .withMessage("please enter the valid email")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 5 })
    .withMessage("password should contain atleat 5 characters long")
    .matches(/^[A-Z]/)
    .withMessage("password should contains atleast  one upper case  letter ")
    .matches(/[a-z]/)
    .withMessage("password should be contains atleast one lower case letter")
    .matches(/[0-9]/)
    .withMessage("password should contains atleast one number ")
    .matches(/[!@&]/)
    .withMessage("the password should contain a special characters")
    .trim(),

  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("password do not match");
      }
      return true;
    }),
  check("role")
    .notEmpty()
    .withMessage("please select a role")
    .isIn(["host", "user"])
    .withMessage("Invalid  user type"),

  (req, res, next) => {
    const { firstname, lastname, email, password, role } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pagetitle: "singn Up",
        isLoggedin: false,
        errors: errors.array().map((error) => error.msg),
        oldInput: {
          firstname,
          lastname,
          email,
          password,
          role,
        },
      });
    }
    bcrypt
      .hash(password, 12)
      .then((hashedpassword) => {
        const user = new User({
          firstname,
          lastname,
          email,
          password: hashedpassword,
          role,
        });
        return user.save();
      })
      .then(() => {
        res.redirect("/login");
      })
      .catch((err) => {
        return res.status(422).render("auth/signup", {
          pagetitle: "singn Up",
          isLoggedin: false,
          errors: [err.message],
          oldInput: {
            firstname,
            lastname,
            email,
            password,
            role,
          },
          user:{}
        });
      });
  },
];
exports.postlogout = (req, res, next) => {
  // res.cookie("isLoggedin",false);
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

exports.getsignup = (req, res, next) => {
  res.render("auth/signup", {
    pagetitle: "login",
    isLoggedin: false,
    errors: [],
    oldInput: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      role: "",
    },
    user :{},
  });
};
