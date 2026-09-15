import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

const signatures = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

export const isDocumentStorageConfigured = () => {
  const env = getEnv();
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
};

const client = () => {
  const env = getEnv();
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
};

export const detectImageFormat = (buffer) =>
  Object.entries(signatures).find(([, bytes]) => bytes.every((byte, index) => buffer[index] === byte))?.[0] ?? null;

export const uploadPrivateImage = (buffer, { folder, publicId }) =>
  new Promise((resolve, reject) => {
    client()
      .uploader.upload_stream({ type: "private", resource_type: "image", folder, public_id: publicId, overwrite: true, invalidate: true }, (error, result) =>
        error ? reject(error) : resolve({ publicId: result.public_id, format: result.format, bytes: result.bytes }),
      )
      .end(buffer);
  });

export const deletePrivateImages = async (publicIds) => {
  if (!publicIds.length || !isDocumentStorageConfigured()) return;
  await client().api.delete_resources(publicIds, { type: "private", resource_type: "image" });
};

export const privateImageUrl = (publicId, format) =>
  client().utils.private_download_url(publicId, format, { resource_type: "image", type: "private", expires_at: Math.floor(Date.now() / 1000) + 60 });
