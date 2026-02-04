import { Request, Response, NextFunction } from 'express';
import { uploadImage, profilePictureOptions, messageImageOptions, groupAvatarOptions } from '@/config/cloudinary';
import { successResponse } from '@/utils/response';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/config/constants';
import { logger } from '@/utils/logger';

// Upload profile picture
export const uploadProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
    }

    const result = await uploadImage(req.file, profilePictureOptions);

    logger.info(`Profile picture uploaded: ${result.publicId}`);

    successResponse(res, {
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};

// Upload message image
export const uploadMessageImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
    }

    const result = await uploadImage(req.file, messageImageOptions);

    logger.info(`Message image uploaded: ${result.publicId}`);

    successResponse(res, {
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};

// Upload group avatar
export const uploadGroupAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
    }

    const result = await uploadImage(req.file, groupAvatarOptions);

    logger.info(`Group avatar uploaded: ${result.publicId}`);

    successResponse(res, {
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};
