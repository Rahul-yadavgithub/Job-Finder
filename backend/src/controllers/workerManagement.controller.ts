import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { logAdminAction } from '../services/adminAudit.service';

export const getPendingRequests = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('worker_registration_requests')
      .select('id, name, email, designation, self_note, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getPendingRequests Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const approveWorker = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { role, branchId } = req.body;

    if (!['caller', 'coordinator', 'head'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' });
      return;
    }

    const { data: request, error: reqError } = await supabase
      .from('worker_registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqError || !request || request.status !== 'pending') {
      res.status(404).json({ success: false, message: 'Pending request not found' });
      return;
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: request.name,
        email: request.email,
        password_hash: request.password_hash,
        roll_number: `WORKER-${Date.now()}`,
        role,
        designation: request.designation,
        branch_id: branchId ?? null,
        status: 'approved',
        approved_by: req.admin!.userId,
        approved_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError || !newUser) {
      console.error('Failed to insert user:', insertError);
      res.status(500).json({ success: false, message: 'Failed to create user' });
      return;
    }

    const { error: updateError } = await supabase
      .from('worker_registration_requests')
      .update({
        status: 'approved',
        reviewed_by: req.admin!.userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update request status (user was created):', updateError);
    }

    await supabase.from('admin_notifications').insert({
      recipient_id: newUser.id,
      type: 'account_approved',
      title: 'Access Approved',
      message: 'Your access request has been approved. You can now log in to the admin panel.'
    });

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_approved',
      targetUserId: newUser.id,
      newValue: { role, designation: request.designation },
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Worker approved successfully' });
  } catch (error) {
    console.error('approveWorker Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const rejectWorker = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, message: 'Reason is required' });
      return;
    }

    const { error } = await supabase
      .from('worker_registration_requests')
      .update({
        status: 'rejected',
        reviewed_by: req.admin!.userId,
        review_note: reason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_rejected',
      reason,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Worker rejected successfully' });
  } catch (error) {
    console.error('rejectWorker Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const suspendWorker = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, message: 'Reason is required' });
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.is_super_admin) {
      res.status(403).json({ success: false, message: 'Cannot suspend the Head TPO' });
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_by: req.admin!.userId
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_suspended',
      targetUserId: userId as string,
      reason,
      ipAddress: req.ip
    });

    await supabase.from('admin_notifications').insert({
      recipient_id: userId,
      type: 'worker_suspended',
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}`
    });

    res.status(200).json({ success: true, message: 'Worker suspended successfully' });
  } catch (error) {
    console.error('suspendWorker Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const reinstateWorker = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('users')
      .update({
        status: 'approved',
        suspended_at: null,
        suspended_by: null
      })
      .eq('id', userId)
      .eq('status', 'suspended');

    if (error) throw error;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_reinstated',
      targetUserId: userId as string,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Worker reinstated successfully' });
  } catch (error) {
    console.error('reinstateWorker Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllWorkers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, name, email, role, designation, 
        status, is_super_admin, designated_successor,
        last_login_at, created_at,
        branch_id,
        branches(name)
      `)
      .in('role', ['head', 'caller', 'coordinator'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    const sorted = data.sort((a, b) => {
      if (a.is_super_admin && !b.is_super_admin) return -1;
      if (!a.is_super_admin && b.is_super_admin) return 1;
      return 0;
    });

    const superAdmin = sorted.find(u => u.is_super_admin);
    const workers = sorted.filter(u => !u.is_super_admin).map(u => ({
      ...u,
      branch_name: (u.branches as any)?.name || null
    }));

    res.status(200).json({
      success: true,
      data: {
        superAdmin: superAdmin ? {
          ...superAdmin,
          branch_name: (superAdmin.branches as any)?.name || null
        } : null,
        workers
      }
    });
  } catch (error) {
    console.error('getAllWorkers Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAuditLog = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const actionType = req.query.action_type as string;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('admin_audit_log')
      .select(`
        *,
        performer:performed_by(name),
        target:target_user_id(name)
      `, { count: 'exact' })
      .order('performed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    const formattedData = data.map(log => ({
      ...log,
      performed_by_name: (log.performer as any)?.name,
      target_user_name: (log.target as any)?.name
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      meta: {
        page,
        limit,
        total: count,
        pages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('getAuditLog Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const designateSuccessor = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId, successionNote } = req.body;

    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .eq('status', 'approved')
      .single();

    if (targetError || !targetUser) {
      res.status(404).json({ success: false, message: 'Approved user not found' });
      return;
    }

    await supabase
      .from('users')
      .update({ designated_successor: false })
      .eq('designated_successor', true);

    const { error: setSuccessorError } = await supabase
      .from('users')
      .update({ designated_successor: true })
      .eq('id', userId);

    if (setSuccessorError) throw setSuccessorError;

    const { error: setNoteError } = await supabase
      .from('users')
      .update({ succession_note: successionNote || null })
      .eq('id', req.admin!.userId);
      
    if (setNoteError) throw setNoteError;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'successor_designated',
      targetUserId: userId,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Successor designated successfully' });
  } catch (error) {
    console.error('designateSuccessor Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCompaniesCount = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.status(200).json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('getCompaniesCount Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAuditTodayCount = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // using ISO string to match current UTC date (since postgres stores as UTC)
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('performed_at', `${today}T00:00:00.000Z`)
      .lt('performed_at', `${today}T23:59:59.999Z`);
    
    if (error) throw error;
    res.status(200).json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('getAuditTodayCount Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
