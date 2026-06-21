import { Request } from 'express';

export interface AdminJWTPayload {
  userId: string;
  name: string;
  email: string;
  role: 'head' | 'caller' | 'coordinator';
  isSuperAdmin: boolean;
  isDesignatedSuccessor: boolean;
  tokenVersion: number;
  jumpedIn?: boolean;
}

export interface AdminRequest extends Request {
  admin?: AdminJWTPayload;
}
