import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { logAdminAction } from '../services/adminAudit.service';
import { sendRecoveryEmail } from '../services/email.service';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const initiateTransfer = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { newHeadEmail, newHeadName, successionNote } = req.body;

    if (!newHeadEmail || !newHeadName) {
      res.status(400).json({ success: false, message: 'New head email and name are required' });
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', newHeadEmail)
      .single();

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('recovery_requests')
      .insert({
        request_type: 'successor_handover',
        initiated_by: req.admin!.userId,
        new_head_email: newHeadEmail,
        new_head_name: newHeadName,
        recovery_token: token,
        token_expires_at: expiresAt,
        status: 'pending',
        developer_notes: existingUser ? 'Existing user account' : 'New user account'
      });

    if (insertError) throw insertError;

    const recoveryLink = `${process.env.ADMIN_BASE_URL || 'http://localhost:3000'}/admin/recovery/complete?token=${token}`;

    await sendRecoveryEmail({
      toEmail: newHeadEmail,
      toName: newHeadName,
      recoveryLink,
      expiresInHours: 24
    });

    if (successionNote) {
      await supabase
        .from('users')
        .update({ succession_note: successionNote })
        .eq('id', req.admin!.userId);
    }

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'leadership_transferred',
      newValue: { newHeadEmail, newHeadName },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Transfer initiated. Setup link sent to new head.'
    });
  } catch (error) {
    console.error('initiateTransfer Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const completeTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Token is required' });
      return;
    }

    const { data: request, error: requestError } = await supabase
      .from('recovery_requests')
      .select('*')
      .eq('recovery_token', token)
      .eq('status', 'pending')
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (requestError || !request) {
      res.status(400).json({ success: false, message: 'Link is invalid or expired' });
      return;
    }

    const { data: currentSuperAdmin } = await supabase
      .from('users')
      .select('id, succession_note')
      .eq('is_super_admin', true)
      .limit(1)
      .single();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', request.new_head_email)
      .single();

    let newHeadId: string;

    if (existingUser) {
      newHeadId = existingUser.id;
      await supabase
        .from('users')
        .update({ is_super_admin: true, role: 'head' })
        .eq('id', newHeadId);
    } else {
      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required to create a new account' });
        return;
      }
      
      const password_hash = await bcrypt.hash(password, 12);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: request.new_head_name,
          email: request.new_head_email,
          password_hash,
          role: 'head',
          is_super_admin: true,
          status: 'approved',
          designation: 'Head TPO',
          roll_number: 'HEAD_TRANSFER' // Placeholder for not-null constraint
        })
        .select('id')
        .single();
        
      if (createError || !newUser) throw createError;
      newHeadId = newUser.id;
    }

    if (currentSuperAdmin) {
      await supabase
        .from('users')
        .update({ is_super_admin: false })
        .eq('id', currentSuperAdmin.id);

      if (currentSuperAdmin.succession_note) {
        await supabase
          .from('users')
          .update({
            succession_note: currentSuperAdmin.succession_note,
            profile_note: `Succession note from previous Head TPO: ${currentSuperAdmin.succession_note}`
          })
          .eq('id', newHeadId);
      }
      
      // Invalidate old super admin token
      // Note: users table needs token_version added via migration
      const { data: currentVersionData } = await supabase
        .from('users')
        .select('token_version')
        .eq('id', currentSuperAdmin.id)
        .single();
        
      const currentVersion = currentVersionData?.token_version || 0;
      await supabase
        .from('users')
        .update({ token_version: currentVersion + 1 })
        .eq('id', currentSuperAdmin.id);
    }

    await supabase
      .from('recovery_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', request.id);

    await logAdminAction({
      performedBy: newHeadId,
      actionType: 'leadership_transferred',
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Leadership transfer complete. You can now log in.'
    });
  } catch (error) {
    console.error('completeTransfer Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSuccessionInfo = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data: successor } = await supabase
      .from('users')
      .select('id, name, email, designation')
      .eq('designated_successor', true)
      .limit(1)
      .single();

    const { data: myUser } = await supabase
      .from('users')
      .select('succession_note')
      .eq('id', req.admin!.userId)
      .single();

    const { data: pendingRequests } = await supabase
      .from('recovery_requests')
      .select('*')
      .eq('status', 'pending');

    res.status(200).json({
      success: true,
      data: {
        successor: successor || null,
        successionNote: myUser?.succession_note || null,
        pendingRequests: pendingRequests || []
      }
    });
  } catch (error) {
    console.error('getSuccessionInfo Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateSuccessionNote = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { note } = req.body;

    const { error } = await supabase
      .from('users')
      .update({ succession_note: note || null })
      .eq('id', req.admin!.userId);

    if (error) throw error;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'succession_note_updated',
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Succession note updated' });
  } catch (error) {
    console.error('updateSuccessionNote Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const checkRecoveryToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Token is required' });
      return;
    }

    const { data: request, error: requestError } = await supabase
      .from('recovery_requests')
      .select('*')
      .eq('recovery_token', token)
      .eq('status', 'pending')
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (requestError || !request) {
      res.status(400).json({ success: false, message: 'Link is invalid or expired' });
      return;
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', request.new_head_email)
      .single();

    res.status(200).json({
      success: true,
      data: {
        name: request.new_head_name,
        email: request.new_head_email,
        isExistingUser: !!existingUser
      }
    });
  } catch (error) {
    console.error('checkRecoveryToken Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
