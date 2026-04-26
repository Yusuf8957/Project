const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

async function sendPhoneOtp(phone, otp) {
  await client.messages.create({
    body: `Your Wanderlust OTP is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });
}

module.exports = sendPhoneOtp;