const User = require("../models/user.js");

// ================= SIGNUP =================
module.exports.renderSignupForm = (req, res) => {
  return res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);

      req.flash("success", "Welcome to Wanderlust!");
      return res.redirect("/listings");
    });

  } catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup");
  }
};

// ================= LOGIN =================
module.exports.renderLoginForm = (req, res) => {
  return res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back!");
  return res.redirect("/listings");
};

// ================= LOGOUT =================
module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.flash("success", "Logged out!");
    return res.redirect("/listings");
  });
};