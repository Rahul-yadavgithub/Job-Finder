import { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { CommunicationTPRRequest } from '../types';
import { supabase } from '../../../config/supabase';

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
    
    try {
      const { data } = await supabase
        .from('users')
        .select('profile_photo_url, display_name, branch_id, branches(name, code), roll_number, mobile_no')
        .eq('id', req.user.userId)
        .single();
        
      res.status(200).json({ 
        success: true, 
        user: { 
          ...req.user, 
          profilePhotoUrl: data?.profile_photo_url, 
          displayName: data?.display_name,
          branchId: data?.branch_id,
          branchName: (data?.branches as any)?.name,
          rollNumber: data?.roll_number,
          mobileNo: data?.mobile_no
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
  };

  getBranches = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data: branches, error } = await supabase
        .from('branches')
        .select('id, name, code');

      if (error) throw error;
      res.status(200).json({ success: true, data: branches });
    } catch (error) {
      console.error('Supabase getBranches error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch branches' });
    }
  };

  updateProfile = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const { profilePhotoUrl, displayName, name, rollNumber, branchId, email, mobileNo } = req.body;
      const updates: any = {};

      if (profilePhotoUrl !== undefined) updates.profile_photo_url = profilePhotoUrl;
      if (displayName !== undefined) updates.display_name = displayName;
      if (name !== undefined) updates.name = name;
      if (rollNumber !== undefined) updates.roll_number = rollNumber;
      if (branchId !== undefined) updates.branch_id = branchId;
      if (email !== undefined) updates.email = email;
      if (mobileNo !== undefined) updates.mobile_no = mobileNo;

      if (email !== undefined || rollNumber !== undefined) {
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id, email, roll_number')
          .neq('id', req.user.userId);

        if (existingUsers) {
          if (email !== undefined && existingUsers.some(u => u.email === email)) {
            res.status(409).json({ success: false, message: 'Email already in use by another user' });
            return;
          }
          if (rollNumber !== undefined && existingUsers.some(u => u.roll_number === rollNumber)) {
            res.status(409).json({ success: false, message: 'Roll number already in use by another user' });
            return;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'No valid fields to update' });
        return;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.userId);

      if (error) throw error;

      res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('TPR Update profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  };
}
