import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types/auth.types';
import { sendResetEmail } from '../utils/email';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, rollNumber, email, password, branchId } = req.body;

    if (!name || !rollNumber || !email || !password || !branchId) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email format' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      return;
    }

    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', branchId)
      .single();

    if (!branch) {
      res.status(400).json({ success: false, message: 'Invalid branch selected' });
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('email, roll_number')
      .or(`email.eq.${email},roll_number.eq.${rollNumber}`);

    if (existingUser && existingUser.length > 0) {
      if (existingUser.some(u => u.email === email)) {
        res.status(409).json({ success: false, message: 'Email already registered' });
        return;
      }
      if (existingUser.some(u => u.roll_number === rollNumber)) {
        res.status(409).json({ success: false, message: 'Roll number already registered' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { error } = await supabase.from('users').insert({
      name,
      roll_number: rollNumber,
      email,
      password_hash: passwordHash,
      role: 'branch_tpr',
      branch_id: branchId,
      status: 'pending'
    });

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Awaiting approval from your coordinator.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*, branches(name)')
      .eq('email', email)
      .single();

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({
        success: false,
        status: 'pending',
        message: 'Your account is awaiting approval.'
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        status: 'suspended',
        message: 'Your account has been suspended.'
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        branchId: user.branch_id,
        branchName: (user.branches as any)?.name ?? null
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.cookie('tpr_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    });

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // If communication_tpr, generate their special token too
    let commToken = undefined;
    if (user.role === 'communication_tpr') {
      const commPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: 'communication_tpr',
        tokenVersion: user.token_version || 0
      };
      
      commToken = jwt.sign(
        commPayload,
        process.env.ADMIN_JWT_SECRET as string,
        { expiresIn: '12h' }
      );

      res.cookie('communication_tpr_token', commToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        branchName: user.branches?.name,
        commToken
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const checkRoleByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }

    const { data: user } = await supabase
      .from('users')
      .select('role, status')
      .eq('email', email)
      .single();

    if (!user) {
      res.status(200).json({ success: true, role: null, status: null });
      return;
    }

    res.status(200).json({ 
      success: true, 
      role: user.role,
      status: user.status 
    });
  } catch (error) {
    // Fail silently on checking role
    res.status(200).json({ success: true, role: null, status: null });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('tpr_token');
  res.status(200).json({ success: true, message: 'Logged out' });
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role, email, branch_id, branches(name), profile_photo_url, display_name')
      .eq('id', req.user!.userId)
      .single();

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        branchId: user.branch_id,
        branchName: (user.branches as any)?.name ?? null,
        profile_photo_url: user.profile_photo_url,
        display_name: user.display_name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBranches = async (req: Request, res: Response): Promise<void> => {
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

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
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
      .single();

    if (!user) {
      // Changed from silent success to explicit error to help with debugging!
      res.status(404).json({ success: false, message: 'This email is not registered in the TPR Portal.' });
      return;
    }

    const secret = process.env.JWT_SECRET + user.password_hash;
    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });

    const frontendUrl = process.env.ADMIN_BASE_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?id=${user.id}&token=${token}`;

    await sendResetEmail(user.email, resetLink);

    res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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
      .single();

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const secret = process.env.JWT_SECRET + user.password_hash;
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
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { profilePhotoUrl, displayName } = req.body;
    const updates: any = {};

    if (profilePhotoUrl !== undefined) {
      updates.profile_photo_url = profilePhotoUrl;
    }
    if (displayName !== undefined) {
      updates.display_name = displayName;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user!.userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};
