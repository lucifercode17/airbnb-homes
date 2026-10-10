const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const parser = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG, and WebP images are allowed.");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Compatible with existing routes using upload.single("photo").
// Multer parses the file in memory; this middleware uploads the buffer to Cloudinary.
const upload = {
  single(fieldName) {
    const parseSingle = parser.single(fieldName);
    return (req, res, next) => {
      parseSingle(req, res, (parseError) => {
        if (parseError) return next(parseError);
        if (!req.file) return next();

        const buffer = req.file.buffer;
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "airbnb-homes",
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ width: 2000, height: 1500, crop: "limit" }],
          },
          (uploadError, result) => {
            if (uploadError) {
              uploadError.status = uploadError.http_code || 502;
              return next(uploadError);
            }
            req.file.path = result.secure_url;
            req.file.filename = result.public_id;
            req.file.cloudinaryResult = result;
            delete req.file.buffer;
            return next();
          }
        );
        stream.end(buffer);
      });
    };
  },
};

module.exports = { cloudinary, upload };
