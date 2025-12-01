// middleware/uploadToCloudinary.js
import multer from "multer";
import cloudinary from "../config/cloudinary.config.js";
import streamifier from "streamifier";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadSingleToCloudinary = (fieldName) => {
  return async (req, res, next) => {
    if (!req.file && !req.files) return next();

    const fileBuffer = req.file ? req.file.buffer : (req.files[fieldName] && req.files[fieldName][0].buffer);
    if (!fileBuffer) return next();

    try {
      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: `gym_staff/${req.user?.id || "public"}` },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });

      const result = await streamUpload(fileBuffer);
      // attach cloudinary result to req.uploadResult
      req.uploadResult = result;
      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }
  };
};
