import multer from 'multer';
import { config } from './env';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file type is allowed
  if (config.upload.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_FILE_TYPE));
  }
};

// Multer upload configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
  },
});