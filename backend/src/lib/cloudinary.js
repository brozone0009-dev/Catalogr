import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) return;

  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.error("CLOUDINARY_ERROR: Missing credentials in environment variables", {
      cloud_name: !!config.cloud_name,
      api_key: !!config.api_key,
      api_secret: !!config.api_secret,
    });
  }

  cloudinary.config(config);
  isConfigured = true;
  console.log("Cloudinary configured for:", config.cloud_name);
}

export async function uploadBufferToCloudinary(buffer, options = {}) {
  ensureCloudinaryConfigured();

  if (!buffer) {
    throw new Error("No buffer provided for upload");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        ...options
      },
      (error, result) => {
        if (error) {
          console.error("CLOUDINARY_UPLOAD_STREAM_ERROR:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Write the buffer to the stream and end it
    stream.end(buffer);
  });
}
