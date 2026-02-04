import { Request, Response, NextFunction } from 'express';
import { upload } from '@/config/multer';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/config/constants';

// Single file upload
export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const multerSingle = upload.single(fieldName);

    multerSingle(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.FILE_TOO_LARGE)
          );
        }
        return next(
          new ApiError(HTTP_STATUS.BAD_REQUEST, err.message || ERROR_MESSAGES.UPLOAD_FAILED)
        );
      }
      next();
    });
  };
};

// Validate file exists
export const validateFile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    return next(
      new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded')
    );
  }
  next();
};