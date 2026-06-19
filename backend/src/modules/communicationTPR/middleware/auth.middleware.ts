import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CommunicationTPRRequest, CommunicationTPRJWTPayload } from '../types';
import { supabase } from '../../../config/supabase';

export const verifyCommunicationTPRToken = async (req: CommunicationTPRRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.communication_tpr_token;
  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET as string) as CommunicationTPRJWTPayload;
    
    // Ensure the token role matches
    if (decoded.role !== 'communication_tpr') {
      res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
      return;
    }

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

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};
