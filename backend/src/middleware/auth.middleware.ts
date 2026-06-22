import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types/auth.types';
import { connection as redisConnection } from '../config/redis';

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.tpr_token;
    if (!token) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload & { jti?: string };
    
    if (decoded.jti) {
      const isBlacklisted = await redisConnection.exists(`bl_${decoded.jti}`);
      if (isBlacklisted) {
        res.status(401).json({ success: false, message: 'Token has been invalidated' });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    next();
  };
};

export const requireBranch = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.branchId) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  next();
};
