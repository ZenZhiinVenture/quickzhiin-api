import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodObject<any, 'strip', z.ZodTypeAny>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        params: req.params,
        query: req.query,
        body: req.body
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation failed:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      return next(error);
    }
  };
};
