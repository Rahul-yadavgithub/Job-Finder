import { Request, Response, NextFunction } from 'express';
import { connection as redisConnection } from '../config/redis';

export const cache = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      return next();
    }

    const authKey = (req as any).user?.branchId || (req as any).admin?.userId || (req as any).user?.userId || 'public';
    const key = `cache:${authKey}:${req.originalUrl || req.url}`;
    
    try {
      const cachedResponse = await redisConnection.get(key);
      
      if (cachedResponse) {
        res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
        res.status(200).json(JSON.parse(cachedResponse));
        return;
      }
      
      const originalJson = res.json;
      res.json = function(body: any): Response {
        redisConnection.setex(key, durationInSeconds, JSON.stringify(body))
          .catch(err => console.error('Redis Cache Set Error:', err));
          
        res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Redis Cache Middleware Error:', error);
      next();
    }
  };
};
