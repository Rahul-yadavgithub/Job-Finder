import { Response, NextFunction } from 'express';
import { AdminRequest } from '../types/admin.types';

export const requireJumpedIn = (req: AdminRequest, res: Response, next: NextFunction): void => {
  if (req.admin?.isSuperAdmin || req.admin?.jumpedIn) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Restricted to Head TPO or Co-worker in Jump In Mode' });
  }
};
