import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.config.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "gym-management/staff",
      resource_type: "auto",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      public_id: `staff_${Date.now()}`
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
});
