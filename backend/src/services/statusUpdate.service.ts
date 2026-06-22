import { supabase } from '../config/supabase';
import { notifyRole } from './notification.service';
import { createNotification } from '../utils/notifications';
import { sendPlacementEmail } from './email.service';

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
      
      // Set original_marked_by if not already set
      if (!current.original_marked_by) {
        payload.original_marked_by = userId;
      }
      
      // Feature 2: In-app Notification and Email to ALL communication_tpr users
      const { data: commTprs } = await supabase.from('users').select('id, email').eq('role', 'communication_tpr');
      const { data: userData } = await supabase.from('users').select('name').eq('id', userId).single();
      const userName = userData?.name || 'A Base TPR';
      const { data: compData } = await supabase.from('companies').select('company_name').eq('id', companyId).single();
      const compName = compData?.company_name || 'A company';

      if (commTprs && commTprs.length > 0) {
        for (const tpr of commTprs) {
          const messageText = `${compName} has shown interest and has been added to your pipeline.` +
            (notes ? `\nNotes from team: '${notes}'` : '') +
            `\nAdded by: ${userName} · Just now`;

          await createNotification(
            tpr.id,
            'new_interested',
            '🎯 New Interested Company',
            messageText,
            { actionUrl: '/communication-tpr/companies', category: 'company' }
          );

          if (tpr.email) {
            const emailHtml = `<p>${compName} has shown interest and has been added to your pipeline.</p>` +
              (notes ? `<p><strong>Notes from team:</strong> '${notes}'</p>` : '') +
              `<p>Added by: ${userName}</p>`;
            
            await sendPlacementEmail({
              toEmail: tpr.email,
              subject: `🎯 New Interested Company — ${compName}`,
              bodyHtml: emailHtml
            });
          }
        }
      }

      // Trigger Notification to Mid TPR (existing MongoDB notification)
      await notifyRole(
        'communication_tpr',
        'New Company Arrival',
        `A Base TPR marked a new company as interested.`,
        '/communication-tpr/companies',
        'company'
      );
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

  // Feature 1: Confirmation Email if they called a company due today
  if (layer === 'base') {
    // using en-CA gives YYYY-MM-DD
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    
    // If next_followup_date was today or earlier, it means it was a due call.
    if (current.next_followup_date && current.next_followup_date <= today) {
       const { data: uData } = await supabase.from('users').select('email').eq('id', userId).single();
       const { data: cData } = await supabase.from('companies').select('company_name').eq('id', companyId).single();
       if (uData?.email && cData?.company_name) {
         const humanStatus = newStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
         const bodyHtml = `<p>You have successfully logged a call for <strong>${cData.company_name}</strong> which was due today.</p>
         <p>Status updated to: ${humanStatus}</p>
         ${notes ? `<p>Notes: ${notes}</p>` : ''}`;
         
         await sendPlacementEmail({
           toEmail: uData.email,
           subject: `✅ Call Logged: ${cData.company_name}`,
           bodyHtml
         });
       }
    }
  }

  return { success: true, updated };
}
