const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  houseName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  // photo is a Cloudinary HTTPS URL for new uploads. Existing local paths remain supported.
  photo: { type: String, default: "" },
  photoPublicId: { type: String, default: "" },
  description: { type: String, default: "" },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Home", homeSchema);
