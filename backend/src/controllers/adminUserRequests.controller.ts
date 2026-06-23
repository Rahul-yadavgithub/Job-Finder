import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { logAdminAction } from '../services/adminAudit.service';

export const getAllUserRequests = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type = 'all', status = 'pending' } = req.query;

    const fetchWorkers = type === 'all' || type === 'worker';
    const fetchTprs = type === 'all' || type === 'branch_tpr';

    const promises = [];

    if (fetchWorkers) {
      let q = supabase
        .from('worker_registration_requests')
        .select('id, name, email, designation, self_note, status, created_at, review_note, reviewed_at');
      if (status !== 'all') {
        q = q.eq('status', status);
      }
      promises.push(q);
    } else {
      promises.push(Promise.resolve({ data: [], error: null } as any));
    }

    if (fetchTprs) {
      let q = supabase
        .from('users')
        .select('id, name, email, roll_number, status, created_at, branches(name, code)')
        .eq('role', 'branch_tpr');
      if (status !== 'all') {
        q = q.eq('status', status);
      }
      promises.push(q);
    } else {
      promises.push(Promise.resolve({ data: [], error: null } as any));
    }

    const [workersRes, tprsRes] = await Promise.all(promises);

    if (workersRes.error) throw workersRes.error;
    if (tprsRes.error) throw tprsRes.error;

    const workerRequests = (workersRes.data || []).map((w: any) => ({
      ...w,
      request_type: 'worker'
    }));

    const branchTprRequests = (tprsRes.data || []).map((t: any) => ({
      ...t,
      branch_name: t.branches?.name,
      branch_code: t.branches?.code,
      request_type: 'branch_tpr'
    }));

    const combined = [...workerRequests, ...branchTprRequests];
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalPending = combined.filter(r => r.status === 'pending').length;

    res.status(200).json({
      success: true,
      data: {
        workerRequests,
        branchTprRequests,
        totalPending,
        combined
      }
    });
  } catch (error) {
    console.error('getAllUserRequests Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUserRequestStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const [workersRes, tprsRes] = await Promise.all([
      supabase.from('worker_registration_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'branch_tpr').eq('status', 'pending')
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending_worker_requests: workersRes.count || 0,
        pending_tpr_requests: tprsRes.count || 0
      }
    });
  } catch (error) {
    console.error('getUserRequestStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const approveBranchTpr = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'branch_tpr')
      .eq('status', 'pending')
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'Pending TPR request not found' });
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'approved',
        approved_by: req.admin!.userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    await supabase.from('admin_notifications').insert({
      recipient_id: userId,
      type: 'account_approved',
      title: 'Access Approved',
      message: 'Your TPR account has been approved. You can now log in.',
      notification_category: 'request'
    });

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_approved',
      targetUserId: userId,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'TPR approved successfully' });
  } catch (error) {
    console.error('approveBranchTpr Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const rejectBranchTpr = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, message: 'Reason is required' });
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'branch_tpr')
      .eq('status', 'pending')
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'Pending TPR request not found' });
      return;
    }

    // Delete the user row — DB only allows 'pending','approved','suspended' statuses.
    // Removing the row lets the person re-register if they wish.
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('status', 'pending');

    if (deleteError) throw deleteError;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_rejected',
      targetUserId: userId,
      reason: reason,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'TPR request rejected and removed' });
  } catch (error) {
    console.error('rejectBranchTpr Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
