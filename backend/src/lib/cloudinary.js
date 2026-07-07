import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfigured() {
  // configure from environment when first used so dotenv ordering isn't brittle
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadBufferToCloudinary(buffer, options = {}) {
  ensureCloudinaryConfigured();
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}
