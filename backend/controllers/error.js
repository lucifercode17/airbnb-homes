
exports.errorhandle = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: "Route not found.",
    path: req.originalUrl,
    isLoggedin: Boolean(req.session?.user),
    user: req.session?.user
      ? {
          _id: req.session.user._id,
          firstname: req.session.user.firstname,
          lastname: req.session.user.lastname,
          email: req.session.user.email,
          role: req.session.user.role,
        }
      : null,
  });
};
