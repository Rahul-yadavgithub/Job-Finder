import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';
import { appendTimeline, getTimeline } from '../services/timeline.service';
import { sendPlacementEmail } from '../services/email.service';

export const getRequests = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type, status } = req.query;

    let query = supabase
      .from('admin_requests')
      .select(`
        *,
        companies:company_id(company_name),
        company_status:assignment_id(branches(name)),
        users:raised_by(name),
        email_templates:attachment_template_id(subject, attachment_filename)
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'pending');
    }

    if (type && type !== 'all') {
      query = query.eq('request_source', type);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    const comm_tpr_requests = [];
    const company_responses = [];
    const head_only_requests = [];

    const isSuperAdminOrJumpedIn = req.admin?.isSuperAdmin || req.admin?.jumpedIn;

    for (const item of data || []) {
      const formatted = {
        ...item,
        company_name: item.companies?.company_name,
        branch_name: item.company_status?.branches?.name,
        raised_by_name: item.users?.name,
        template_subject: item.email_templates?.subject,
        attachment_filename: item.email_templates?.attachment_filename,
      };

      if (item.requires_head_tpo && !isSuperAdminOrJumpedIn) {
        head_only_requests.push(formatted);
      } else {
        if (item.requires_head_tpo) head_only_requests.push(formatted);
        else if (item.request_source === 'comm_tpr') comm_tpr_requests.push(formatted);
        else if (item.request_source === 'company_response') company_responses.push(formatted);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        comm_tpr_requests,
        company_responses,
        head_only_requests,
        total_pending: data?.length || 0
      }
    });
  } catch (error: any) {
    console.error('getRequests Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const previewRequest = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('admin_requests')
      .select('*, email_templates:attachment_template_id(subject, attachment_filename)')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('previewRequest Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const actionRequest = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    const { data: request, error: fetchError } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      res.status(404).json({ success: false, message: 'Pending request not found' });
      return;
    }

    const isSuperAdminOrJumpedIn = req.admin?.isSuperAdmin || req.admin?.jumpedIn;
    if (request.requires_head_tpo && !isSuperAdminOrJumpedIn) {
      res.status(403).json({ success: false, message: 'Requires Head TPO action' });
      return;
    }

    if (action === 'send') {
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
        .from('admin_requests')
        .update({
          status: 'actioned',
          actioned_by: req.admin?.userId,
          actioned_at: new Date().toISOString()
        })
        .eq('id', id);

      let eventType = 'custom_document_sent';
      let topStage = 'brochure_sent';
      if (request.request_type === 'send_brochure') {
        eventType = 'brochure_sent';
        topStage = 'brochure_sent';
      } else if (request.request_type === 'send_jnf') {
        eventType = 'jnf_sent';
        topStage = 'jnf_sent';
      } else if (request.request_type === 'send_database') {
        eventType = 'database_sent';
        topStage = 'database_sent';
      }

      await appendTimeline({
        companyId: request.company_id,
        assignmentId: request.assignment_id,
        eventType,
        performedBy: req.admin?.userId,
        performedByLayer: 'admin',
        title: `Email sent: ${request.email_subject || 'Document'}`,
        description: `Sent to ${request.email_to || 'Company'}`,
        metadata: { request_type: request.request_type, email_to: request.email_to, email_subject: request.email_subject },
        visibilityScope: 'communication_tpr_and_above'
      });

      await supabase
        .from('company_status')
        .update({ top_stage: topStage })
        .eq('id', request.assignment_id);

      if (request.raised_by) {
        await supabase.from('admin_notifications').insert({
          recipient_id: request.raised_by,
          type: 'request_actioned',
          title: 'Request Actioned',
          message: `Your request to send ${request.request_type.replace('send_', '')} has been processed.`,
          notification_category: 'request'
        });
      }
    } else if (action === 'reject') {
      if (!rejectionReason) {
        res.status(400).json({ success: false, message: 'Rejection reason required' });
        return;
      }
      await supabase
        .from('admin_requests')
        .update({
          status: 'rejected',
          actioned_by: req.admin?.userId,
          rejection_reason: rejectionReason,
          actioned_at: new Date().toISOString()
        })
        .eq('id', id);

      if (request.raised_by) {
        await supabase.from('admin_notifications').insert({
          recipient_id: request.raised_by,
          type: 'request_rejected',
          title: 'Request Rejected',
          message: `Your request was rejected: ${rejectionReason}`,
          notification_category: 'request'
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('actionRequest Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logCompanyResponse = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      assignmentId,
      responseDate,
      responseMethod,
      respondedByName,
      respondedByTitle,
      responseSummary,
      nextActionRequested,
      nextActionNotes
    } = req.body;

    const { data: statusData } = await supabase
      .from('company_status')
      .select('company_id')
      .eq('id', assignmentId)
      .single();

    if (!statusData) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    const { error } = await supabase
      .from('company_responses')
      .insert({
        company_id: statusData.company_id,
        assignment_id: assignmentId,
        response_date: responseDate,
        response_method: responseMethod,
        responded_by_name: respondedByName,
        responded_by_title: respondedByTitle,
        response_summary: responseSummary,
        next_action_requested: nextActionRequested,
        next_action_notes: nextActionNotes,
        logged_by: req.admin?.userId
      });

    if (error) throw error;

    await appendTimeline({
      companyId: statusData.company_id,
      assignmentId: assignmentId,
      eventType: 'company_replied',
      title: 'Company response logged',
      description: responseSummary,
      metadata: { nextActionRequested, respondedByName },
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'communication_tpr_and_above'
    });

    if (nextActionRequested && nextActionRequested !== 'no_action' && nextActionRequested !== 'other') {
      const requiresHeadTPO = ['send_jnf', 'send_database'].includes(nextActionRequested);
      await supabase.from('admin_requests').insert({
        request_source: 'company_response',
        request_type: nextActionRequested,
        requires_head_tpo: requiresHeadTPO,
        company_id: statusData.company_id,
        assignment_id: assignmentId,
        raised_by: req.admin?.userId,
        notes: `Auto-created from company response: ${nextActionNotes || ''}`,
        urgency: 'normal'
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('logCompanyResponse Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const confirmDrive = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const {
      assignmentId,
      driveType,
      scheduledDate,
      scheduledTime,
      venue,
      eligibleBranches,
      eligibleYear,
      eligibleCgpa,
      rolesOffered,
      salaryPackage,
      registrationDeadline
    } = req.body;

    const { data: statusData } = await supabase
      .from('company_status')
      .select('company_id')
      .eq('id', assignmentId)
      .single();

    if (!statusData) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    const { data: drive, error } = await supabase
      .from('drive_details')
      .insert({
        company_id: statusData.company_id,
        assignment_id: assignmentId,
        drive_type: driveType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        venue: venue,
        eligible_branches: eligibleBranches,
        eligible_year: eligibleYear,
        eligible_cgpa: eligibleCgpa,
        roles_offered: rolesOffered,
        salary_package: salaryPackage,
        registration_deadline: registrationDeadline,
        confirmed_by: req.admin?.userId,
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !drive) throw error || new Error('Failed to create drive');

    await supabase
      .from('company_status')
      .update({
        top_stage: 'drive_confirmed',
        drive_id: drive.id
      })
      .eq('id', assignmentId);

    await appendTimeline({
      companyId: statusData.company_id,
      assignmentId: assignmentId,
      eventType: 'drive_confirmed',
      title: 'Drive Confirmed',
      description: `Scheduled for ${scheduledDate} at ${scheduledTime}`,
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'communication_tpr_and_above'
    });

    res.status(200).json({ success: true, driveId: drive.id });
  } catch (error: any) {
    console.error('confirmDrive Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const openRegistration = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: drive, error: driveError } = await supabase
      .from('drive_details')
      .update({ registration_open: true })
      .eq('id', id)
      .select('company_id, assignment_id')
      .single();

    if (driveError || !drive) {
      res.status(404).json({ success: false, message: 'Drive not found' });
      return;
    }

    await appendTimeline({
      companyId: drive.company_id,
      assignmentId: drive.assignment_id,
      eventType: 'registrations_opened',
      title: 'Registrations Opened',
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'communication_tpr_and_above'
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('openRegistration Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDriveDetails = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const { data, error } = await supabase
      .from('drive_details')
      .select('*')
      .eq('assignment_id', assignmentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('getDriveDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllDrives = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('drive_details')
      .select(`
        *,
        companies (company_name),
        company_status!drive_details_assignment_id_fkey (branches (name))
      `)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    const formattedDrives = data.map(drive => ({
      ...drive,
      company_name: drive.companies?.company_name,
      branch_name: drive.company_status?.branches?.name
    }));

    res.status(200).json({ success: true, data: formattedDrives });
  } catch (error: any) {
    console.error('getAllDrives Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getWorkflowTemplates = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('company_workflow_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('getWorkflowTemplates Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCompanyWorkflows = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    
    // First find the active assignment
    const { data: statusData, error: statusError } = await supabase
      .from('company_status')
      .select('id')
      .eq('company_id', companyId)
      .single();
      
    if (statusError || !statusData) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const { data: instances, error } = await supabase
      .from('company_workflows')
      .select('*')
      .eq('assignment_id', statusData.id);

    if (error) throw error;

    // Fetch all templates to guarantee UI buttons exist even if untouched
    const { data: templates, error: templatesError } = await supabase
      .from('company_workflow_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (templatesError) throw templatesError;

    const formatted = templates?.map(template => {
      const existing = instances?.find(i => i.workflow_type === template.workflow_type);
      return {
        workflow_type: template.workflow_type,
        display_name: template.display_name,
        status: existing?.status || template.allowed_states[0], // Default to first state if never touched
        allowed_states: template.allowed_states,
        updated_at: existing?.updated_at || new Date().toISOString()
      };
    }) || [];

    res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('getCompanyWorkflows Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const transitionWorkflowState = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId, workflowType } = req.params;
    const { new_status, notes } = req.body;

    const { data: statusData, error: statusError } = await supabase
      .from('company_status')
      .select('company_id')
      .eq('id', assignmentId)
      .single();
      
    if (statusError || !statusData) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    // Upsert the workflow state
    const { error: upsertError } = await supabase
      .from('company_workflows')
      .upsert({
        assignment_id: assignmentId,
        workflow_type: workflowType,
        status: new_status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'assignment_id, workflow_type' });

    if (upsertError) throw upsertError;

    const { data: template } = await supabase
      .from('company_workflow_templates')
      .select('display_name')
      .eq('workflow_type', workflowType)
      .single();

    const displayName = template?.display_name || workflowType;

    await appendTimeline({
      companyId: statusData.company_id,
      assignmentId: assignmentId as string,
      eventType: 'status_updated',
      title: `${displayName} updated to ${new_status}`,
      description: notes || '',
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'all_roles'
    });

    res.status(200).json({ success: true, message: 'Workflow transitioned' });
  } catch (error: any) {
    console.error('transitionWorkflowState Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addCustomTimelineEvent = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { title, description, notes } = req.body;

    const { data: statusData } = await supabase
      .from('company_status')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (!statusData) {
      res.status(404).json({ success: false, message: 'No active assignment found for company' });
      return;
    }

    await appendTimeline({
      companyId: companyId as string,
      assignmentId: statusData.id,
      eventType: 'note_added',
      title: title,
      description: description,
      conversationNotes: notes,
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'all_roles'
    });

    res.status(200).json({ success: true, message: 'Event added' });
  } catch (error: any) {
    console.error('addCustomTimelineEvent Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const delegateTask = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { companyId, assignmentId, workflowType, taskName, assignedTo } = req.body;
    
    // Create the task
    const { error } = await supabase
      .from('workflow_tasks')
      .insert({
        company_id: companyId,
        assignment_id: assignmentId,
        workflow_type: workflowType,
        task_name: taskName,
        assigned_to: assignedTo,
        created_by: req.admin?.userId
      });

    if (error) throw error;

    // Fetch assignee name for timeline
    const { data: user } = await supabase.from('users').select('name').eq('id', assignedTo).single();
    const assigneeName = user?.name || 'a team member';

    // Drop timeline event
    await appendTimeline({
      companyId,
      assignmentId,
      eventType: 'status_updated',
      title: `Task Delegated: ${taskName}`,
      description: `Assigned to ${assigneeName}`,
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'all_roles'
    });

    res.status(200).json({ success: true, message: 'Task delegated successfully' });
  } catch (error: any) {
    console.error('delegateTask Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMyTasks = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    let query = supabase
      .from('workflow_tasks')
      .select('*, companies(company_name), users!workflow_tasks_assigned_to_fkey(name)')
      .eq('assigned_to', req.admin?.userId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const formatted = data.map(t => ({
      ...t,
      company_name: t.companies?.company_name,
      assigned_to_name: t.users?.name || 'Unknown'
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('getMyTasks Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTaskStatus = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body; // status can be 'in_progress', 'waiting_response', 'completed', 'cancelled'

    const { data: task, error: taskError } = await supabase
      .from('workflow_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw taskError || new Error('Task not found');

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('workflow_tasks')
      .update(updateData)
      .eq('id', taskId);

    if (updateError) throw updateError;

    // Update the parent workflow automatically if it's completed or waiting response
    let newWorkflowStatus = null;
    if (status === 'completed') {
      newWorkflowStatus = 'acknowledged'; // generic mapping, ideally front-end or mapping logic determines this
      if (task.workflow_type === 'jnf') newWorkflowStatus = 'received';
      if (task.workflow_type === 'database') newWorkflowStatus = 'received';
      if (task.workflow_type === 'brochure') newWorkflowStatus = 'acknowledged';
    } else if (status === 'waiting_response') {
      newWorkflowStatus = 'waiting_response';
    } else if (status === 'in_progress') {
       // if task is in progress, maybe the workflow is 'sent'
       newWorkflowStatus = 'sent';
    }

    if (newWorkflowStatus) {
      await supabase
        .from('company_workflows')
        .upsert({
          assignment_id: task.assignment_id,
          workflow_type: task.workflow_type,
          status: newWorkflowStatus,
          updated_at: new Date().toISOString()
        }, { onConflict: 'assignment_id, workflow_type' });
    }

    await appendTimeline({
      companyId: task.company_id,
      assignmentId: task.assignment_id,
      eventType: status === 'completed' ? 'status_changed' : 'status_updated',
      title: `Task Update: ${task.task_name} marked as ${status.replace('_', ' ')}`,
      description: notes || '',
      performedBy: req.admin?.userId,
      performedByLayer: 'admin',
      visibilityScope: 'all_roles'
    });

    res.status(200).json({ success: true, message: 'Task updated successfully' });
  } catch (error: any) {
    console.error('updateTaskStatus Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCoworkerDashboardStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const userId = req.admin?.userId;
    
    // 1. My Task Breakdown
    const { data: tasks, error: taskError } = await supabase
      .from('workflow_tasks')
      .select('status, workflow_type')
      .eq('assigned_to', userId);

    if (taskError) throw taskError;

    const taskStats = {
      pending: 0,
      inProgress: 0,
      waitingResponse: 0,
      completed: 0,
      byType: {
        brochure: 0,
        jnf: 0,
        database: 0,
        drive: 0
      }
    };

    tasks.forEach(t => {
      if (t.status === 'pending') taskStats.pending++;
      else if (t.status === 'in_progress') taskStats.inProgress++;
      else if (t.status === 'waiting_response') taskStats.waitingResponse++;
      else if (t.status === 'completed') {
        taskStats.completed++;
        if (t.workflow_type) {
          taskStats.byType[t.workflow_type as keyof typeof taskStats.byType] = 
            (taskStats.byType[t.workflow_type as keyof typeof taskStats.byType] || 0) + 1;
        }
      }
    });

    // 2. Platform Pulse (Global company stats)
    const { data: companies, error: compError } = await supabase
      .from('company_status')
      .select('base_status');

    if (compError) throw compError;

    const pipelineStats = {
      interested: 0,
      under_communication: 0,
      head_review: 0,
      transferred_to_head: 0,
      recruitment_in_progress: 0,
      completed: 0
    };

    companies.forEach(c => {
      if (c.base_status && pipelineStats[c.base_status as keyof typeof pipelineStats] !== undefined) {
        pipelineStats[c.base_status as keyof typeof pipelineStats]++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        taskStats,
        pipelineStats
      }
    });
  } catch (error) {
    console.error('getCoworkerDashboardStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
