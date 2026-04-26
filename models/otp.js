const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ["email", "phone", "forgot"] },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);