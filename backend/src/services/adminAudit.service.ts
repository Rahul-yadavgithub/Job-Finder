import { supabase } from '../config/supabase';

export interface AdminAuditParams {
  performedBy: string;
  actionType: string;
  targetUserId?: string;
  targetBranchId?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
}

export async function logAdminAction({
  performedBy,
  actionType,
  targetUserId,
  targetBranchId,
  oldValue,
  newValue,
  reason,
  ipAddress
}: AdminAuditParams): Promise<void> {
  try {
    const { error } = await supabase.from('admin_audit_log').insert({
      performed_by: performedBy,
      action_type: actionType,
      target_user_id: targetUserId,
      target_branch_id: targetBranchId,
      old_value: oldValue,
      new_value: newValue,
      reason,
      ip_address: ipAddress
    });
    if (error) {
      console.error('Failed to insert admin audit log:', error);
    }
  } catch (err) {
    console.error('Exception while inserting admin audit log:', err);
  }
}
