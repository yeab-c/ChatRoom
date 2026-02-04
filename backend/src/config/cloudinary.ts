import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';
import { logger } from '@/utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

// Upload options for profile pictures
export const profilePictureOptions = {
  folder: 'chatroom/profiles',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [
    {
      width: 500,
      height: 500,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:good',
    },
  ],
};

// Upload options for message images
export const messageImageOptions = {
  folder: 'chatroom/messages',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [
    {
      width: 1024,
      height: 1024,
      crop: 'limit',
      quality: 'auto:good',
    },
  ],
};

// Upload options for group avatars
export const groupAvatarOptions = {
  folder: 'chatroom/groups',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [
    {
      width: 500,
      height: 500,
      crop: 'fill',
      quality: 'auto:good',
      gravity: 'face',
    },
  ],
};

// Upload image to Cloudinary
export const uploadImage = async (
  file: Express.Multer.File,
  options: {
    folder: string;
    allowed_formats: string[];
    transformation: Array<{
      width: number;
      height: number;
      crop: string;
      quality: string;
      gravity?: string;
    }>;
  }
): Promise<{ url: string; publicId: string }> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  } catch (error) {
    logger.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted: ${publicId}`);
  } catch (error) {
    logger.error('Error deleting image:', error);
    throw error;
  }
};

export { cloudinary };