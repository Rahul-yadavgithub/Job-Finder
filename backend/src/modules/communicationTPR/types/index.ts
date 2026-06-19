import { Request } from 'express';

export interface CommunicationTPRJWTPayload {
  userId: string;
  name: string;
  email: string;
  role: 'communication_tpr';
  tokenVersion: number;
}

export interface CommunicationTPRRequest extends Request {
  user?: CommunicationTPRJWTPayload;
}
