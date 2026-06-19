import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  role: 'branch_tpr' | 'caller' | 'head';
  branchId: string | null;
  branchName: string | null;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}
