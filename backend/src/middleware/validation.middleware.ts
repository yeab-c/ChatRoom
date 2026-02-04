import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApiError } from '@/utils/errors';
import { HTTP_STATUS } from '@/config/constants';
import { sanitizeObject } from '@/utils/sanitization';

// Validation location type
type ValidationLocation = 'body' | 'query' | 'params';

// Create validation middleware
export const validate = (
  schema: ZodSchema,
  location: ValidationLocation = 'body'
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get data from specified location
      const data = req[location];

      // Sanitize input first
      const sanitized = sanitizeObject(data);

      // Validate with schema
      const validated = await schema.parseAsync(sanitized);

      // Replace request data with validated data
      req[location] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(
          new ApiError(
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            'Validation failed',
            errorMessages
          )
        );
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const schemas = {
  // ID parameter
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // Pagination
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  }),

  // Email
  email: z.string().email('Invalid email format'),

  // Password (strong)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Password must contain at least one special character'
    ),

  // Name
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),

  // Message content
  messageContent: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long'),

  // Group name
  groupName: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name is too long'),
};