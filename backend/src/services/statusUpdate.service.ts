import { supabase } from '../config/supabase';

export interface StatusUpdateParams {
  companyId: string;
  userId: string;
  layer: 'base' | 'mid' | 'top';
  newStatus: string;
  notes?: string;
  nextFollowupDate?: string;
  branchId?: string; // required for base layer
}

export interface StatusUpdateResult {
  success: boolean;
  updated: any;
}

export async function applyStatusUpdate({
  companyId,
  userId,
  layer,
  newStatus,
  notes,
  nextFollowupDate,
  branchId
}: StatusUpdateParams): Promise<StatusUpdateResult> {
  const { data: current, error: fetchError } = await supabase
    .from('company_status')
    .select('*, companies(branch_id)')
    .eq('company_id', companyId)
    .single();

  if (fetchError || !current) {
    throw new Error('Company not found');
  }

  if (layer === 'base') {
    if (current.companies?.branch_id !== branchId) {
      throw new Error('Access denied');
    }
    if (current.locked === true) {
      throw new Error('Company is locked by mid-layer');
    }
  }

  if (layer === 'mid') {
    if (current.locked === false) {
      throw new Error('Company is not in mid-layer review');
    }
  }

  const payload: any = { updated_at: new Date().toISOString() };
  if (notes) payload.notes = notes;

  if (layer === 'base') {
    payload.base_status = newStatus;
    if (nextFollowupDate) payload.next_followup_date = nextFollowupDate;

    if (newStatus === 'interested') {
      payload.locked = true;
      payload.locked_by = userId;
      payload.locked_at = new Date().toISOString();
      payload.mid_status = 'pending_review';
    }
  } else if (layer === 'mid') {
    payload.mid_status = newStatus;
    if (newStatus === 'revoked') {
      payload.locked = false;
      payload.locked_by = null;
      payload.locked_at = null;
      payload.base_status = 'call_again';
      payload.mid_status = 'revoked';
    }
  } else if (layer === 'top') {
    payload.top_status = newStatus;
  }

  let oldStatus = null;
  if (layer === 'base') oldStatus = current.base_status;
  else if (layer === 'mid') oldStatus = current.mid_status;
  else if (layer === 'top') oldStatus = current.top_status;

  const { data: updated, error: updateError } = await supabase
    .from('company_status')
    .update(payload)
    .eq('company_id', companyId)
    .select()
    .single();

  if (updateError) throw updateError;

  const { error: historyError } = await supabase
    .from('status_history')
    .insert({
      company_id: companyId,
      changed_by: userId,
      layer,
      old_status: oldStatus,
      new_status: newStatus,
      reason: notes
    });

  if (historyError) {
    console.error('Failed to insert status history:', historyError);
  }

  const { error: logError } = await supabase
    .from('contact_log')
    .insert({
      company_id: companyId,
      logged_by: userId,
      outcome: newStatus,
      notes
    });

  if (logError) {
    console.error('Failed to insert contact log:', logError);
  }

  return { success: true, updated };
}
