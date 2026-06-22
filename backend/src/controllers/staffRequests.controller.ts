import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { sendPlacementEmail } from '../services/email.service';
import { appendTimeline } from '../services/timeline.service';

export const getStaffRequests = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('staff_requests')
      .select(`
        *,
        companies:company_id(
          company_name,
          branches(name)
        ),
        users:raised_by(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(item => ({
      ...item,
      company_name: item.companies?.company_name,
      branch_name: item.companies?.branches?.name,
      raised_by_name: item.users?.name,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('getStaffRequests Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendStaffRequest = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: request, error: fetchError } = await supabase
      .from('staff_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (request.email_to && request.email_subject) {
      await sendPlacementEmail({
        toEmail: request.email_to,
        subject: request.email_subject,
        bodyHtml: request.email_body,
        attachmentUrl: request.attachment_url,
        attachmentFilename: request.attachment_filename
      });
    }

    await supabase
      .from('staff_requests')
      .update({
        status: 'waiting_response',
        sent_at: new Date().toISOString()
      })
      .eq('id', id);

    // Note: communication_requests status remains 'approved' while staff is handling it

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('sendStaffRequest Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markResponse = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { outcome, notes } = req.body;

    const { data: request, error: fetchError } = await supabase
      .from('staff_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    if (outcome === 'accepted') {
      const { error: statusError } = await supabase.from('company_status').update({ 
        mid_status: 'accepted',
        locked: true,
        top_status: null // This puts it in the 'New' tab on the Admin Dashboard
      }).eq('id', request.assignment_id);

      if (statusError) console.error('Failed to update company_status:', statusError);

      await supabase.from('companies').update({
        brochure_completed: true,
        brochure_completed_at: new Date().toISOString()
      }).eq('id', request.company_id);

      await supabase.from('admin_requests').insert({
        company_id: request.company_id,
        assignment_id: request.assignment_id,
        request_source: 'comm_tpr',
        request_type: 'send_brochure',
        requires_head_tpo: false, // Since TPO staff cleared it
        raised_by: request.raised_by,
        email_to: request.email_to,
        email_subject: request.email_subject,
        email_body: request.email_body,
        attachment_template_id: request.attachment_template_id,
        status: 'actioned', // Show it as already done so Head TPR sees it
        notes: `TPO Staff Accepted. Notes: ${notes || ''}`
      });

      await supabase.from('staff_requests').update({ status: 'accepted' }).eq('id', id);
      await supabase.from('communication_requests').update({ status: 'completed' }).eq('company_id', request.company_id).eq('status', 'approved');

      // Update workflow state to show it's completed on Head TPR dashboard
      const { error: wfError } = await supabase.from('company_workflows').upsert({
        assignment_id: request.assignment_id,
        workflow_type: 'brochure',
        status: 'acknowledged',
        updated_at: new Date().toISOString()
      }, { onConflict: 'assignment_id, workflow_type' });
      
      if (wfError) console.error('Failed to update workflow:', wfError);

      await appendTimeline({
        companyId: request.company_id,
        assignmentId: request.assignment_id,
        eventType: 'brochure_sent',
        performedBy: req.admin?.userId,
        performedByLayer: 'admin',
        title: 'Company Accepted by TPO Staff',
        description: notes || '',
        visibilityScope: 'all_roles'
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('markResponse Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const rejectStaffRequest = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      res.status(400).json({ success: false, message: 'Notes required for rejection' });
      return;
    }

    const { data: request, error: fetchError } = await supabase
      .from('staff_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Get original_marked_by
    const { data: statusData } = await supabase.from('company_status').select('original_marked_by').eq('id', request.assignment_id).single();

    await supabase.from('staff_requests').update({
      status: 'rejected',
      rejection_reason: notes,
      actioned_at: new Date().toISOString()
    }).eq('id', id);

    await supabase.from('company_status').update({
      mid_status: 'rejected'
    }).eq('company_id', request.company_id);

    await supabase.from('communication_requests').update({ 
      status: 'rejected',
      rejection_notes: notes,
      rejected_by: req.admin?.userId,
      rejected_at: new Date().toISOString()
    }).eq('company_id', request.company_id).eq('status', 'approved');

    if (statusData?.original_marked_by) {
      await supabase.from('admin_notifications').insert({
        recipient_id: statusData.original_marked_by,
        type: 'request_rejected',
        title: 'Company Rejected (No Response)',
        message: `TPO Staff rejected company. Notes: ${notes}`,
        notification_category: 'request'
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('rejectStaffRequest Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
