const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Otp = require("../models/otp"); // ✅ lowercase 'otp' fix
const sendEmailOtp = require("../utils/sendEmail");
const { saveRedirect } = require("../middleware");

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── SIGNUP FORM ───────────────────────────────────────
router.get("/signup", (req, res) => {
  return res.render("users/signup");
});

// ─── SIGNUP — Send OTP first ───────────────────────────
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, phone, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email is already registered!");
      return res.redirect("/signup");
    }

    const otp = generateOtp();
    await Otp.deleteMany({ identifier: email, type: "email" });
    await Otp.create({
      identifier: email,
      otp,
      type: "email",
      expiresAt: new Date(Date.now() + 1 * 60 * 1000),
    });
    await sendEmailOtp(email, otp);

    req.session.pendingSignup = { username, email, phone, password, role };

    return res.render("users/otp-verify", {
      type: "email",
      identifier: email,
      isSignup: true,
    });

  } catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup");
  }
});

// ─── LOGIN FORM ────────────────────────────────────────
router.get("/login", (req, res) => {
  if (req.query.redirect) {
    req.session.redirectUrl = req.query.redirect;
  }
  return res.render("users/login", {
    message: req.query.message || null
  });
});

// ─── LOGIN — Direct login, no OTP ─────────────────────
router.post("/login", saveRedirect,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    return res.redirect(redirectUrl);
  }
);

// ─── VERIFY OTP (signup only) ──────────────────────────
router.post("/verify-otp", async (req, res, next) => {
  try {
    const { otp, isSignup } = req.body;

    if (isSignup === "true") {
      const pendingSignup = req.session.pendingSignup;

      if (!pendingSignup) {
        req.flash("error", "Session expired, please signup again");
        return res.redirect("/signup");
      }

      const { username, email, phone, password, role } = pendingSignup;

      const record = await Otp.findOne({ identifier: email, type: "email" });

      if (!record) {
        req.flash("error", "OTP not found, please request a new one");
        return res.render("users/otp-verify", { type: "email", identifier: email, isSignup: true });
      }
      if (record.expiresAt < new Date()) {
        req.flash("error", "OTP has expired, please request a new one");
        return res.render("users/otp-verify", { type: "email", identifier: email, isSignup: true });
      }
      if (record.otp !== otp) {
        req.flash("error", "Invalid OTP, please try again");
        return res.render("users/otp-verify", { type: "email", identifier: email, isSignup: true });
      }

      await Otp.deleteOne({ _id: record._id });
      delete req.session.pendingSignup;

      const newUser = new User({
        username,
        email,
        phone,
        role: role || "traveller",
        isEmailVerified: true,
      });
      const registeredUser = await User.register(newUser, password);

      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome to Wanderlust! 🎉");
        return res.redirect("/listings");
      });
      return;
    }

  } catch (e) {
    return next(e);
  }
});

// ─── FORGOT PASSWORD — Show form ───────────────────────
router.get("/forgot-password", (req, res) => {
  return res.render("users/forgot-password");
});

// ─── FORGOT PASSWORD — Send OTP ────────────────────────
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "No account found with this email");
      return res.redirect("/forgot-password");
    }

    const otp = generateOtp();
    await Otp.deleteMany({ identifier: email, type: "forgot" });
    await Otp.create({
      identifier: email,
      otp,
      type: "forgot",
      expiresAt: new Date(Date.now() + 1 * 60 * 1000),
    });
    await sendEmailOtp(email, otp);

    req.session.forgotEmail = email;

    return res.render("users/otp-verify", {
      type: "forgot",
      identifier: email,
      isSignup: false,
    });

  } catch (e) {
    return next(e);
  }
});

// ─── FORGOT PASSWORD — Verify OTP ──────────────────────
router.post("/verify-forgot-otp", async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = req.session.forgotEmail;

    if (!email) {
      req.flash("error", "Session expired, please try again");
      return res.redirect("/forgot-password");
    }

    const record = await Otp.findOne({ identifier: email, type: "forgot" });

    if (!record) {
      req.flash("error", "OTP not found, please request a new one");
      return res.render("users/otp-verify", { type: "forgot", identifier: email, isSignup: false });
    }
    if (record.expiresAt < new Date()) {
      req.flash("error", "OTP has expired, please request a new one");
      return res.render("users/otp-verify", { type: "forgot", identifier: email, isSignup: false });
    }
    if (record.otp !== otp) {
      req.flash("error", "Invalid OTP, please try again");
      return res.render("users/otp-verify", { type: "forgot", identifier: email, isSignup: false });
    }

    await Otp.deleteOne({ _id: record._id });
    req.session.resetVerified = true;

    return res.render("users/reset-password", { email });

  } catch (e) {
    return next(e);
  }
});

// ─── RESET PASSWORD — Set new password ─────────────────
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!req.session.resetVerified) {
      req.flash("error", "Unauthorized access, please try again");
      return res.redirect("/forgot-password");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.render("users/reset-password", { email });
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/forgot-password");
    }

    await user.setPassword(newPassword);
    await user.save();

    delete req.session.forgotEmail;
    delete req.session.resetVerified;

    req.flash("success", "Password reset successful! Please login.");
    return res.redirect("/login");

  } catch (e) {
    return next(e);
  }
});

// ─── LOGOUT ───────────────────────────────────────────
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    return res.redirect("/listings");
  });
});

module.exports = router;