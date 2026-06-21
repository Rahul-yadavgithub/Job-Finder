export interface CommunicationTPRUser {
  userId: string;
  name: string;
  email: string;
  role: 'communication_tpr';
  tokenVersion: number;
  profilePhotoUrl?: string;
  displayName?: string;
  branchName?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: CommunicationTPRUser;
}
