import { Response } from 'express';
import { HTTP_STATUS } from '@/config/constants';

// Success response interface
interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Success response helper
export const successResponse = <T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  meta?: SuccessResponse['meta']
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

// Paginated response helper
export const paginatedResponse = <T = any>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response => {
  const totalPages = Math.ceil(total / limit);

  return successResponse(
    res,
    data,
    message,
    HTTP_STATUS.OK,
    {
      page,
      limit,
      total,
      totalPages,
    }
  );
};

// Created response (201)
export const createdResponse = <T = any>(
  res: Response,
  data?: T,
  message?: string
): Response => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

// No content response (204)
export const noContentResponse = (res: Response): Response => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  stack?: string;
}

// Error response helper
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: any[]
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};
