import { Response } from 'express';
import { AdminRequest } from '../types/admin.types';
import { supabase } from '../config/supabase';

export const getTemplates = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .eq('template_type', 'jnf_form')
      .order('template_type', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('getAdminTemplates Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

export const uploadTemplate = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { template_type, branch_id, subject, body_draft, attachment_url, attachment_filename } = req.body;
    
    const payload: any = {
      template_type,
      subject,
      body_draft,
      uploaded_by: req.admin?.userId,
      updated_at: new Date().toISOString()
    };
    
    if (branch_id !== undefined) payload.branch_id = branch_id;
    if (attachment_url !== undefined) payload.attachment_url = attachment_url;
    if (attachment_filename !== undefined) payload.attachment_filename = attachment_filename;

    let existing;
    if (branch_id) {
      const { data } = await supabase.from('email_templates').select('id').eq('template_type', template_type).eq('branch_id', branch_id).single();
      existing = data;
    } else {
      const { data } = await supabase.from('email_templates').select('id').eq('template_type', template_type).is('branch_id', null).single();
      existing = data;
    }

    let result;
    if (existing?.id) {
      result = await supabase.from('email_templates').update(payload).eq('id', existing.id).select('*').single();
    } else {
      result = await supabase.from('email_templates').insert(payload).select('*').single();
    }

    if (result.error) throw result.error;
    res.status(200).json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('uploadAdminTemplate Error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload template' });
  }
};
