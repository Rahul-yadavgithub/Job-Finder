import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { logAdminAction } from '../services/adminAudit.service';

export const getPeopleStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const coworkerRoles = ['head', 'caller', 'coordinator'];
    
    const [
      cwTotalRes, cwActiveRes, cwSuspendedRes, cwHeadRes, cwCallerRes, cwCoordinatorRes,
      tprTotalRes, tprActiveRes, tprPendingRes, tprSuspendedRes,
      commTprTotalRes,
      branchesRes
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).in('role', coworkerRoles),
      supabase.from('users').select('*', { count: 'exact', head: true }).in('role', coworkerRoles).eq('status', 'approved'),
      supabase.from('users').select('*', { count: 'exact', head: true }).in('role', coworkerRoles).eq('status', 'suspended'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'head'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'caller'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'coordinator'),
      
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'branch_tpr'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'branch_tpr').eq('status', 'approved'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'branch_tpr').eq('status', 'pending'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'branch_tpr').eq('status', 'suspended'),
      
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'communication_tpr'),
      
      supabase.from('branches').select('id, name, code, users(id, status)')
    ]);

    // Compute per-branch breakdown in JS natively
    const perBranch = (branchesRes.data || []).map((branch: any) => {
      // We only care about users who are branch_tprs in that branch.
      // Since our nested select brings all users for that branch, we must filter if needed, 
      // but in this app, usually only TPRs are assigned to branches (coworkers have null branch or global branch).
      // Let's explicitly fetch only branch_tprs in a separate query to be 100% safe, 
      // or we can rely on the fact that only branch_tprs have branches usually.
      // To be strictly correct, let's fetch all branch_tprs and group them.
      return null;
    });

    // Instead of the nested users select (which pulls all roles for that branch), 
    // let's do a fast grouping of all branch TPRs in memory.
    const { data: allTprs } = await supabase.from('users').select('id, status, branch_id').eq('role', 'branch_tpr');
    
    const perBranchStats = (branchesRes.data || []).map((b: any) => {
      const branchTprs = (allTprs || []).filter(t => t.branch_id === b.id);
      return {
        branch_name: b.name,
        branch_code: b.code,
        tpr_count: branchTprs.length,
        active_count: branchTprs.filter(t => t.status === 'approved').length
      };
    }).sort((a, b) => a.branch_name.localeCompare(b.branch_name));

    res.status(200).json({
      success: true,
      data: {
        coworkers: {
          total: cwTotalRes.count || 0,
          active: cwActiveRes.count || 0,
          suspended: cwSuspendedRes.count || 0,
          head_count: cwHeadRes.count || 0,
          caller_count: cwCallerRes.count || 0,
          coordinator_count: cwCoordinatorRes.count || 0
        },
        branchTprs: {
          total: tprTotalRes.count || 0,
          active: tprActiveRes.count || 0,
          pending: tprPendingRes.count || 0,
          suspended: tprSuspendedRes.count || 0
        },
        commTprs: {
          total: commTprTotalRes.count || 0
        },
        perBranch: perBranchStats
      }
    });

  } catch (error) {
    console.error('getPeopleStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCoworkers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, designation, status, is_super_admin, designated_successor, last_login_at, created_at, approved_at, profile_photo_url, mobile_no, users!approved_by(name)')
      .in('role', ['head', 'caller', 'coordinator']);

    if (error) throw error;

    const mapped = data.map((u: any) => ({
      ...u,
      approved_by_name: u.users?.name || null
    }));

    mapped.sort((a, b) => {
      if (a.is_super_admin && !b.is_super_admin) return -1;
      if (!a.is_super_admin && b.is_super_admin) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error('getCoworkers Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBranchTprs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { branchId, status } = req.query;

    let query = supabase
      .from('users')
      .select('id, name, email, roll_number, status, last_login_at, created_at, profile_photo_url, mobile_no, branch_id, branches(name, code), users!approved_by(name)')
      .eq('role', 'branch_tpr');

    if (branchId) query = query.eq('branch_id', branchId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    // Fetch company counts per branch (only interested and not revoked ones)
    const branchIds = [...new Set(data.map(u => u.branch_id).filter(Boolean))];
    const { data: branchComps } = await supabase
      .from('company_status')
      .select('branch_id')
      .in('branch_id', branchIds)
      .eq('base_status', 'interested')
      .or('mid_status.neq.revoked,mid_status.is.null');

    const branchCompanyCounts = (branchComps || []).reduce((acc: any, comp: any) => {
      if (comp.branch_id) {
        acc[comp.branch_id] = (acc[comp.branch_id] || 0) + 1;
      }
      return acc;
    }, {});

    const mapped = data.map((u: any) => ({
      ...u,
      branch_name: u.branches?.name,
      branch_code: u.branches?.code,
      approved_by_name: u.users?.name || null,
      companies_added: u.branch_id ? (branchCompanyCounts[u.branch_id] || 0) : 0
    }));

    mapped.sort((a, b) => {
      const bNameA = a.branch_name || '';
      const bNameB = b.branch_name || '';
      if (bNameA !== bNameB) return bNameA.localeCompare(bNameB);
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error('getBranchTprs Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const revokeApproval = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, message: 'Reason is required' });
      return;
    }

    if (userId === req.admin!.userId) {
      res.status(403).json({ success: false, message: 'Cannot revoke your own access' });
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
      res.status(403).json({ success: false, message: 'Cannot revoke access of a super admin' });
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

    await supabase.from('admin_notifications').insert({
      recipient_id: userId,
      type: 'worker_suspended',
      title: 'Access Revoked',
      message: `Your access has been revoked. Reason: ${reason}`,
      notification_category: 'worker'
    });

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'user_suspended',
      targetUserId: userId,
      reason: reason,
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Access revoked successfully' });
  } catch (error) {
    console.error('revokeApproval Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCommunicationTprs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, roll_number, status, last_login_at, created_at, profile_photo_url, mobile_no, branches(name, code), users!approved_by(name)')
      .eq('role', 'communication_tpr');

    if (error) throw error;

    const mapped = data.map((u: any) => ({
      ...u,
      branch_name: u.branches?.name,
      branch_code: u.branches?.code,
      approved_by_name: u.users?.name || null
    }));

    mapped.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error('getCommunicationTprs Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const promoteToCommunicationTpr = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.role !== 'branch_tpr') {
      res.status(400).json({ success: false, message: 'Only Branch TPRs can be promoted to Communication TPRs' });
      return;
    }

    if (user.status !== 'approved') {
      res.status(400).json({ success: false, message: 'Only active (approved) TPRs can be promoted' });
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'communication_tpr' })
      .eq('id', userId);

    if (updateError) throw updateError;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'role_changed',
      targetUserId: userId,
      reason: 'Promoted to Communication TPR',
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Promoted to Communication TPR successfully' });
  } catch (error) {
    console.error('promoteToCommunicationTpr Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const demoteToBranchTpr = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.role !== 'communication_tpr') {
      res.status(400).json({ success: false, message: 'User is not a Communication TPR' });
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'branch_tpr' })
      .eq('id', userId);

    if (updateError) throw updateError;

    await logAdminAction({
      performedBy: req.admin!.userId,
      actionType: 'role_changed',
      targetUserId: userId,
      reason: 'Demoted to Branch TPR',
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, message: 'Demoted to Branch TPR successfully' });
  } catch (error) {
    console.error('demoteToBranchTpr Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPersonDetails = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id as string;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, roll_number, status, designation, is_super_admin, designated_successor, last_login_at, created_at, approved_at, profile_photo_url, mobile_no, branches(id, name, code), users!approved_by(name)')
      .eq('id', userId)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let branchCompanies: any[] = [];
    if ((data as any).branches?.id || (data as any).branch_id) {
      const branchId = (data as any).branches?.id || (data as any).branch_id;
      const { data: comps } = await supabase
        .from('company_status')
        .select('base_status, mid_status, companies!inner(id, company_name, created_at, status)')
        .eq('branch_id', branchId)
        .eq('base_status', 'interested')
        .or('mid_status.neq.revoked,mid_status.is.null');
        
      branchCompanies = comps?.map(c => ({
        ...(c.companies as any),
        status: c.base_status
      })) || [];
    }

    const mapped = {
      ...data,
      branch_name: (data as any).branches?.name,
      branch_code: (data as any).branches?.code,
      approved_by_name: (data as any).users?.name || null,
      companies_added: branchCompanies.length,
      companies_list: branchCompanies
    };

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    console.error('getPersonDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
