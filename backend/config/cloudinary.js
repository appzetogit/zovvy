import { v2 as cloudinary } from 'cloudinary';
import multerStorageCloudinary from 'multer-storage-cloudinary';
const { CloudinaryStorage } = multerStorageCloudinary;
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'farmlyf_banners',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
  },
});

export { cloudinary, storage };
