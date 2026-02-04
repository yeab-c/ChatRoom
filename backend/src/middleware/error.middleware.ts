import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';
import { HTTP_STATUS } from '@/config/constants';

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
}

// Global error handler
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert non-ApiError to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, undefined, false, error.stack);
  }

  const apiError = error as ApiError;

  // Log error
  if (apiError.isOperational) {
    logger.warn('Operational error:', {
      message: apiError.message,
      statusCode: apiError.statusCode,
      details: apiError.details,
      path: req.path,
      method: req.method,
      userId: req.userId,
    });
  } else {
    logger.error('Non-operational error:', {
      message: apiError.message,
      statusCode: apiError.statusCode,
      stack: apiError.stack,
      path: req.path,
      method: req.method,
      userId: req.userId,
    });
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: apiError.message,
    statusCode: apiError.statusCode,
  };

  // Include details if available
  if (apiError.details) {
    errorResponse.details = apiError.details;
  }

  // Include stack trace in development
  if (config.isDevelopment && apiError.stack) {
    errorResponse.stack = apiError.stack;
  }

  // Send error response
  res.status(apiError.statusCode).json(errorResponse);
};

// 404 Not Found handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new ApiError(
    HTTP_STATUS.NOT_FOUND,
    `Route ${req.originalUrl} not found`
  );
  next(error);
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
