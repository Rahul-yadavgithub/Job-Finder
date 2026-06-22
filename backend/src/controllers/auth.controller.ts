import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../types/auth.types';
import { sendResetEmail } from '../utils/email';
import { v2 as cloudinary } from 'cloudinary';
import { connection as redisConnection } from '../config/redis';

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
      { expiresIn: '8h', jwtid: uuidv4() }
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
        { expiresIn: '12h', jwtid: uuidv4() }
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

export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.tpr_token;
  if (token) {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.jti && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await redisConnection.setex(`bl_${decoded.jti}`, expiresIn, 'blacklisted');
        }
      }
    } catch (e) {
      console.error('Logout blacklist error', e);
    }
  }
  
  res.clearCookie('tpr_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.clearCookie('communication_tpr_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ success: true, message: 'Logged out' });
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, role, email, branch_id, branches(name), profile_photo_url, display_name, roll_number, mobile_no')
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
        display_name: user.display_name,
        rollNumber: user.roll_number,
        mobileNo: user.mobile_no
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
        .neq('id', req.user!.userId);

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

    // Handle Cloudinary Deletion if profile photo is being changed or removed
    if (profilePhotoUrl !== undefined) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('profile_photo_url')
        .eq('id', req.user!.userId)
        .single();
        
      if (currentUser?.profile_photo_url && currentUser.profile_photo_url !== profilePhotoUrl) {
        try {
          const uploadIndex = currentUser.profile_photo_url.indexOf('/upload/');
          let publicId = '';
          if (uploadIndex !== -1) {
            const afterUpload = currentUser.profile_photo_url.substring(uploadIndex + 8);
            const pathParts = afterUpload.split('/');
            if (pathParts[0].startsWith('v') && !isNaN(parseInt(pathParts[0].substring(1)))) {
              pathParts.shift();
            }
            const publicIdWithExt = pathParts.join('/');
            publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
          }

          if (publicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_CLOUD_NAME) {
            cloudinary.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET
            });
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted old profile photo from Cloudinary: ${publicId}`);
          } else {
            console.warn('Cloudinary credentials missing. Could not delete old profile photo.');
          }
        } catch (delError) {
          console.error('Failed to delete old profile photo from Cloudinary', delError);
        }
      }
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
