const express = require("express");
const router = express.Router();

const passport = require("passport");
const User = require("../models/user");

// 🔥 middleware
const { saveRedirect } = require("../middleware");


// ================= SIGNUP FORM =================
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
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
      res.redirect("/listings");
    });

  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});


// ================= LOGIN FORM =================
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});


// ================= LOGIN =================
router.post(
  "/login",
  saveRedirect,   // 🔥 important
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");

    // ✅ SMART REDIRECT FIX
    let redirectUrl = res.locals.redirectUrl || "/listings";

    // 🔥 optional (clean session)
    delete req.session.redirectUrl;

    res.redirect(redirectUrl);
  }
);


// ================= LOGOUT =================
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
});


module.exports = router;