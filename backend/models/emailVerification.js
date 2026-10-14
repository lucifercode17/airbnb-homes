
const mongoose = require("mongoose");

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);
