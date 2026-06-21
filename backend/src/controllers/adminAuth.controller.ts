import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminRequest } from '../types/admin.types';
import { sendResetEmail } from '../utils/email';
export const adminLogin = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*, token_version')
      .eq('email', email)
      .in('role', ['head', 'caller', 'coordinator'])
      .single();
      
    if (error || !user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    
    if (user.status === 'pending') {
      res.status(403).json({
        success: false,
        status: 'pending',
        message: 'Your registration is pending approval from Head TPO.'
      });
      return;
    }
    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        status: 'suspended',
        message: 'Your account has been suspended. Contact Head TPO.'
      });
      return;
    }
    if (user.status === 'rejected') {
      res.status(403).json({
        success: false,
        status: 'rejected',
        message: 'Your registration was not approved.'
      });
      return;
    }
    
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    
    const payload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.is_super_admin,
      isDesignatedSuccessor: user.designated_successor,
      tokenVersion: user.token_version || 0
    };
    
    const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET as string, { expiresIn: '12h' });
    
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000
    });
    
    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        isSuperAdmin: user.is_super_admin,
        designation: user.designation
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const requestAccess = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, designation, selfNote } = req.body;
    
    if (!name || !email || !password || !designation) {
      res.status(400).json({ success: false, message: 'All fields except selfNote are required' });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters and contain both numbers and letters' });
      return;
    }
    
    if (!['caller', 'coordinator', 'assistant_tpo'].includes(designation)) {
      res.status(400).json({ success: false, message: 'Invalid designation' });
      return;
    }
    
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }
    
    const { data: existingRequest } = await supabase.from('worker_registration_requests').select('id').eq('email', email).eq('status', 'pending').single();
    if (existingRequest) {
      res.status(409).json({ success: false, message: 'A pending request with this email exists' });
      return;
    }
    
    const password_hash = await bcrypt.hash(password, 12);
    
    const { error: insertError } = await supabase.from('worker_registration_requests').insert({
      name,
      email,
      password_hash,
      designation,
      self_note: selfNote,
      status: 'pending'
    });
    
    if (insertError) throw insertError;
    
    const { data: superAdmin } = await supabase.from('users').select('id').eq('is_super_admin', true).limit(1).single();
    
    if (superAdmin) {
      await supabase.from('admin_notifications').insert({
        recipient_id: superAdmin.id,
        type: 'new_registration_request',
        title: 'New Access Request',
        message: `${name} (${designation}) has requested access.`,
        notification_category: 'request',
        action_url: '/admin/requests'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Access request submitted. You will be notified once Head TPO reviews your request.'
    });
  } catch (error) {
    console.error('Request Access Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminLogout = async (req: AdminRequest, res: Response): Promise<void> => {
  res.clearCookie('admin_token');
  res.status(200).json({ success: true });
};

export const adminMe = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.admin!.userId;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_super_admin, designated_successor, status, designation, profile_photo_url, display_name')
      .eq('id', userId)
      .single();
      
    if (error || !user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    const { count: unreadCount, error: countError } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
      
    res.status(200).json({
      success: true,
      data: {
        ...user,
        jumpedIn: req.admin?.jumpedIn,
        unreadNotifications: unreadCount || 0
      }
    });
  } catch (error) {
    console.error('Admin Me Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const jumpIn = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin?.isSuperAdmin) {
      res.status(403).json({ success: false, message: 'Only Super Admin can jump in' });
      return;
    }
    
    const payload = {
      ...req.admin,
      jumpedIn: true
    };
    // remove exp/iat if present
    delete (payload as any).iat;
    delete (payload as any).exp;

    const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET as string, { expiresIn: '12h' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const jumpOut = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    
    const payload = {
      ...req.admin,
      jumpedIn: false
    };
    delete (payload as any).iat;
    delete (payload as any).exp;

    const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET as string, { expiresIn: '12h' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.admin!.userId;
    const { displayName, profilePhotoUrl } = req.body;

    const updates: any = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (profilePhotoUrl !== undefined) updates.profile_photo_url = profilePhotoUrl;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, message: 'No fields to update' });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
      return;
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminForgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email)
      .in('role', ['head', 'caller', 'coordinator'])
      .single();

    if (!user) {
      res.status(404).json({ success: false, message: 'This email is not registered in the Admin Portal.' });
      return;
    }

    const secret = process.env.ADMIN_JWT_SECRET + user.password_hash;
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });

    const frontendUrl = process.env.TPO_ADMIN_BASE_URL || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/reset-password?id=${user.id}&token=${token}`;

    await sendResetEmail(user.email, resetLink);

    res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Admin Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const adminResetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, token, newPassword } = req.body;

    if (!id || !token || !newPassword) {
      res.status(400).json({ success: false, message: 'Missing required parameters' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', id)
      .in('role', ['head', 'caller', 'coordinator'])
      .single();

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const secret = process.env.ADMIN_JWT_SECRET + user.password_hash;
    try {
      jwt.verify(token, secret);
    } catch (err) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Admin Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
