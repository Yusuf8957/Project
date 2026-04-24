const express = require("express");
const router = express.Router();

const passport = require("passport");
const User = require("../models/user");

// middleware
const { saveRedirect } = require("../middleware");


// ================= SIGNUP FORM =================
router.get("/signup", (req, res) => {
  return res.render("users/signup");
});


// ================= SIGNUP =================
router.post("/signup", async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    const newUser = new User({ username, email });

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }

      req.flash("success", "Welcome to Wanderlust!");
      return res.redirect("/listings"); // ✅ IMPORTANT
    });

  } catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup"); // ✅ IMPORTANT
  }
});


// ================= LOGIN FORM =================
router.get("/login", (req, res) => {
  return res.render("users/login");
});


// ================= LOGIN =================
router.post(
  "/login",
  saveRedirect,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");

    let redirectUrl = res.locals.redirectUrl || "/listings";

    delete req.session.redirectUrl;

    return res.redirect(redirectUrl); // ✅ IMPORTANT
  }
);


// ================= LOGOUT =================
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.flash("success", "Logged out successfully!");
    return res.redirect("/listings"); // ✅ IMPORTANT
  });
});


module.exports = router;