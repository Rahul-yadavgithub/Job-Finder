import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminRequest, AdminJWTPayload } from '../types/admin.types';
import { supabase } from '../config/supabase';

export const verifyAdminToken = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.admin_token;
  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET as string) as AdminJWTPayload;
    
    const { data } = await supabase
      .from('users')
      .select('token_version, status')
      .eq('id', decoded.userId)
      .single();

    if (data?.status === 'suspended') {
      res.status(401).json({ success: false, message: 'Account suspended' });
      return;
    }

    if (data && decoded.tokenVersion !== undefined && decoded.tokenVersion < (data?.token_version || 0)) {
      res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export const requireSuperAdmin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  if (req.admin?.isSuperAdmin === true) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Restricted to Head TPO only' });
  }
};

export const requireAdminRole = (...roles: Array<'head' | 'caller' | 'coordinator'>) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (req.admin && roles.includes(req.admin.role)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient role' });
    }
  };
};
