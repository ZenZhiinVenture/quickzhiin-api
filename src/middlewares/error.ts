import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Global error handling middleware.
 * Catches errors from route handlers and other middleware.
 * Sends standardized error responses.
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error occurred:', err); // Log the error for debugging

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.flatten().fieldErrors, // Provides detailed field errors
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ');
      return res.status(409).json({
        // 409 Conflict
        message: `Conflict: A record with this ${target} already exists.`,
        code: err.code,
      });
    }
    // Record to update/delete does not exist
    if (err.code === 'P2025') {
      return res.status(404).json({
        message: 'Not Found: The requested resource could not be found.',
        code: err.code,
      });
    }
    // Add handling for other Prisma error codes as needed
    return res.status(500).json({
      message: 'Database error occurred.',
      code: err.code,
      details: 'PrismaClientKnownRequestError',
    });
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      message: 'Database validation error.',
      details: 'PrismaClientValidationError',
      // Consider logging err.message for more details in development
    });
  }

  // Handle generic errors
  // Avoid sending detailed internal error messages to the client in production
  const statusCode = (err as any).statusCode || 500; // Use custom status code if available
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred';

  return res.status(statusCode).json({ message });
};
