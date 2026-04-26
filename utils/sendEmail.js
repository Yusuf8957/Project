const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmailOtp(email, otp) {
  await transporter.sendMail({
    from: `"Wanderlust" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Wanderlust OTP",
    html: `
      <div style="font-family:sans-serif; padding:30px; max-width:400px; margin:auto; border:1px solid #eee; border-radius:12px;">
        <h2 style="color:#fe424d;">Wanderlust 🏕️</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:10px; color:#fe424d;">${otp}</h1>
        <p style="color:#888;">Valid for 1 minute. Do not share with anyone.</p>
      </div>
    `,
  });
}

module.exports = sendEmailOtp;