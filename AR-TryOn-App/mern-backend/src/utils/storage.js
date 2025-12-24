import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import cloudinary from 'cloudinary';
import { promisify } from 'util';

const uploadDir = path.join(process.cwd(), 'uploads');

cloudinary.v2.config(process.env.CLOUDINARY_URL || {});

export async function uploadLocal(file) {
  // file: { path, filename }
  const rel = `/uploads/${file.filename}`;
  return { url: `${config.baseUrl}${rel}`, key: file.filename };
}

export async function uploadToCloudinary(file) {
  const upload = promisify(cloudinary.v2.uploader.upload);
  const res = await upload(file.path, { resource_type: 'auto' });
  return { url: res.secure_url, key: res.public_id };
}

export async function uploadFile(file) {
  if (!file) return null;
  if (config.storageProvider === 'cloudinary') return uploadToCloudinary(file);
  // s3 not implemented in this minimal version
  return uploadLocal(file);
}

export function getPublicUrl(filename) {
  return `${config.baseUrl}/uploads/${filename}`;
}

