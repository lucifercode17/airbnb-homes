const user = require("../models/user");

exports.errorhandle =((req, res, next) => {
  res.status(404).render( '404',{pagetitle:"404 error",
    isLoggedin: req.isLoggedin,
    user: req.session.user,
  });
});