import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
import { errorResponse } from '../shared/utils/response';
import { ZodError } from 'zod';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.errors
    );
  }

  // Handle operational errors
  if (error instanceof AppError) {
    return errorResponse(
      res,
      error.message,
      error.statusCode,
      error.code,
      error.details
    );
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      return errorResponse(
        res,
        'A record with this value already exists',
        409,
        'DUPLICATE_ENTRY',
        { field: prismaError.meta?.target }
      );
    }

    if (prismaError.code === 'P2025') {
      return errorResponse(
        res,
        'Record not found',
        404,
        'NOT_FOUND'
      );
    }
  }

  // Handle unknown errors
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
    500,
    'INTERNAL_ERROR'
  );
};

// Async handler wrapper to catch async errors
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
