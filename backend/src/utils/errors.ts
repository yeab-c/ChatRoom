import { HTTP_STATUS } from '@/config/constants';

// Base API Error class
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(
    statusCode: number,
    message: string,
    details?: any,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Specific error classes
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(HTTP_STATUS.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(HTTP_STATUS.FORBIDDEN, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(HTTP_STATUS.NOT_FOUND, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(HTTP_STATUS.CONFLICT, message, details);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: any) {
    super(HTTP_STATUS.BAD_REQUEST, message, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests') {
    super(HTTP_STATUS.TOO_MANY_REQUESTS, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details?: any) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, details, false);
  }
}