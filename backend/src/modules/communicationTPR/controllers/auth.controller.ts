import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { CommunicationTPRRequest } from '../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsedBody = loginSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ success: false, message: 'Invalid input', errors: parsedBody.error.issues });
        return;
      }

      const { token, user } = await this.authService.login(parsedBody.data);

      res.cookie('communication_tpr_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
      });

      res.status(200).json({ success: true, user });
    } catch (error: any) {
      console.error('Communication TPR Login Error:', error);
      res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
  };

  logout = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      if (req.user) {
        await this.authService.logout(req.user.userId);
      }
      res.clearCookie('communication_tpr_token');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Communication TPR Logout Error:', error);
      res.status(500).json({ success: false, message: 'Failed to logout' });
    }
  };

  me = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    res.status(200).json({ success: true, user: req.user });
  };
}
