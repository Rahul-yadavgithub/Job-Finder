import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { sendPlacementEmail } from '../services/email.service';
import { appendTimeline } from '../services/timeline.service';
import { createNotification } from '../utils/notifications';

export const getStaffRequests = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('staff_requests')
      .select(`
        *,
        companies:company_id(
          company_name,
          hr_name,
          phone_number,
          branches(name)
        ),
        users:raised_by(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(item => ({
      ...item,
      company_name: item.companies?.company_name,
      hr_name: item.companies?.hr_name,
      phone_number: item.companies?.phone_number,
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
      // 1. Fetch user and company details for the notification
      const { data: userData } = await supabase.from('users').select('name, email').eq('id', statusData.original_marked_by).single();
      const { data: compData } = await supabase.from('companies').select('company_name').eq('id', request.company_id).single();
      
      const adminName = req.admin?.name || 'Admin Name';
      const companyName = compData?.company_name || 'A company';
      
      // 2. Feature 3: In-app Notification
      await createNotification(
        statusData.original_marked_by,
        'company_rejected',
        '❌ Company Update',
        `${companyName} has not been moved forward in the pipeline.\nReason: '${notes}' — Reviewed by ${adminName}.`,
        { actionUrl: '/dashboard/companies', category: 'request' }
      );

      // 3. Feature 3: Email Notification
      if (userData?.email) {
        const userFirstName = (userData.name || 'User').split(' ')[0];
        const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <p>Hi ${userFirstName},</p>
            <p>We wanted to update you on a company in your pipeline.</p>
            <p>
              <strong>Company:</strong> ${companyName}<br>
              <strong>Status:</strong> Not moving forward<br>
              <strong>Reviewed by:</strong> ${adminName}<br>
              <strong>Date:</strong> ${dateStr}
            </p>
            ${notes ? `<p><strong>Notes from reviewer:</strong><br>"${notes}"</p>` : ''}
            <p>If you have questions, please reach out to your manager directly.</p>
            <p>— JobFinder Team</p>
          </div>
        `;

        await sendPlacementEmail({
          toEmail: userData.email,
          subject: `Update on ${companyName} — JobFinder`,
          bodyHtml: emailHtml
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('rejectStaffRequest Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const archiveStaffRequest = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { salaryPackage, driveDate } = req.body || {};

    const { data: request, error: fetchError } = await supabase
      .from('staff_requests')
      .select('company_id, assignment_id')
      .eq('id', id)
      .single();

    if (fetchError || !request) throw fetchError || new Error('Request not found');

    if (salaryPackage || driveDate) {
       const { data: existingDrive } = await supabase
          .from('drive_details')
          .select('id')
          .eq('assignment_id', request.assignment_id)
          .single();
       
       if (existingDrive) {
          const updates: any = {};
          if (salaryPackage) updates.salary_package = salaryPackage;
          if (driveDate) updates.scheduled_date = driveDate;
          
          await supabase.from('drive_details').update(updates).eq('id', existingDrive.id);
       } else {
          const { data: newDrive, error: driveErr } = await supabase.from('drive_details').insert({
             company_id: request.company_id,
             assignment_id: request.assignment_id,
             drive_type: 'in_campus',
             salary_package: salaryPackage || null,
             scheduled_date: driveDate || null,
             confirmed_by: req.admin?.userId,
             confirmed_at: new Date().toISOString()
          }).select().single();

          if (!driveErr && newDrive) {
             await supabase.from('company_status').update({
                top_stage: 'drive_confirmed',
                drive_id: newDrive.id
             }).eq('id', request.assignment_id);
          }
       }
    }

    // We use rejection_reason = 'ARCHIVED' as a workaround to archive tasks 
    // since 'completed' is restricted by Postgres constraints.
    const { error } = await supabase
      .from('staff_requests')
      .update({ rejection_reason: 'ARCHIVED' })
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Request archived successfully' });
  } catch (error: any) {
    console.error('archiveStaffRequest Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
