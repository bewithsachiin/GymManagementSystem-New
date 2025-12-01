import cloudinary from "../config/cloudinary.config.js";

export const deleteCloudinaryFile = async (url) => {
  if (!url) return;

  // Extract public_id from Cloudinary URL
  const parts = url.split("/");
  const publicIdWithExtension = parts.slice(-1)[0];
  const publicId = publicIdWithExtension.split(".")[0];

  try {
    await cloudinary.uploader.destroy(`gym-management/staff/${publicId}`);
  } catch (error) {
    console.log("Cloudinary delete error:", error);
  }
};
