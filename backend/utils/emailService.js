
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationOtp(email, otp) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your Airbnb account",
    text: `Your verification code is ${otp}. It expires in 5 minutes.`,
    html: `
      <h2>Verify your email</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 8px">${otp}</h1>
      <p>This code expires in 5 minutes. Do not share it with anyone.</p>
    `,
  });
}

module.exports = { sendVerificationOtp };
