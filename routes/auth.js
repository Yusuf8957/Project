const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Otp = require("../models/Otp");
const sendEmailOtp = require("../utils/sendEmail");
const sendPhoneOtp = require("../utils/sendSMS");

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── SEND EMAIL OTP ───────────────────────────────────
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = generateOtp();

    // Delete any existing OTP for this email
    await Otp.deleteMany({ identifier: email, type: "email" });

    // Save new OTP
    await Otp.create({
      identifier: email,
      otp,
      type: "email",
      expiresAt: new Date(Date.now() + 1 * 60 * 1000), // Expires in 1 minute
    });

    await sendEmailOtp(email, otp);
    res.json({ message: "OTP sent to email" });

  } catch (err) {
    res.status(500).json({ message: "Failed to send email OTP", error: err.message });
  }
});

// ─── SEND PHONE OTP ───────────────────────────────────
router.post("/send-phone-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    const otp = generateOtp();

    // Delete any existing OTP for this phone
    await Otp.deleteMany({ identifier: phone, type: "phone" });

    await Otp.create({
      identifier: phone,
      otp,
      type: "phone",
      expiresAt: new Date(Date.now() + 1 * 60 * 1000), // Expires in 1 minute
    });

    await sendPhoneOtp(phone, otp);
    res.json({ message: "OTP sent to phone" });

  } catch (err) {
    res.status(500).json({ message: "Failed to send phone OTP", error: err.message });
  }
});

// ─── VERIFY OTP (works for both email and phone) ──────
router.post("/verify-otp", async (req, res) => {
  try {
    const { identifier, otp, type } = req.body;
    // identifier = email address or phone number

    const record = await Otp.findOne({ identifier, type });

    if (!record) return res.status(400).json({ message: "OTP not found" });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: "OTP has expired" });
    if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // OTP verified — remove from database
    await Otp.deleteOne({ _id: record._id });

    // Mark user as verified in User model
    // await User.updateOne({ email: identifier }, { isVerified: true });

    res.json({ message: "Verification successful ✅" });

  } catch (err) {
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

module.exports = router;