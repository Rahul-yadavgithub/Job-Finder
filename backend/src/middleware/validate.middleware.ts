import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodRawShape, ZodError } from 'zod';

export const validate = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof ZodError || (error && (error as any).name === 'ZodError')) {
        const issues = (error as any).issues || (error as any).errors || [];
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: issues.map((e: any) => ({
            path: e.path ? e.path.join('.') : 'unknown',
            message: e.message,
          })),
        });
      } else {
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  };
};
