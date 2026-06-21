import { supabase } from '../config/supabase';

export interface TimelineEvent {
  companyId: string;
  assignmentId?: string;
  eventType: string;
  performedBy?: string;
  performedByLayer?: 'base' | 'comm' | 'admin' | 'system';
  title: string;
  description?: string;
  metadata?: any;
  conversationNotes?: string;
  visibilityScope?: 'admin_only' | 'base_tpr_and_above' | 'communication_tpr_and_above' | 'head_tpr_and_above' | 'all_roles';
}

export async function appendTimeline(event: TimelineEvent): Promise<void> {
  try {
    let assignmentId = event.assignmentId;
    if (!assignmentId) {
      const { data } = await supabase.from('company_status').select('id').eq('company_id', event.companyId).single();
      if (data) assignmentId = data.id;
      else return console.error('[Timeline Service] Could not infer assignmentId');
    }

    const { error } = await supabase
      .from('company_timeline')
      .insert([{
        company_id: event.companyId,
        assignment_id: assignmentId,
        event_type: event.eventType,
        performed_by: event.performedBy,
        performed_by_layer: event.performedByLayer,
        title: event.title,
        description: event.description,
        conversation_notes: event.conversationNotes,
        metadata: event.metadata || {},
        visibility_scope: event.visibilityScope || 'all_roles'
      }]);

    if (error) {
      console.error('[Timeline Service] Failed to append event:', error);
    }
  } catch (err) {
    console.error('[Timeline Service] Exception while appending event:', err);
  }
}

export async function getTimeline(companyId: string, viewerLayer: 'base' | 'comm' | 'admin'): Promise<any[]> {
  try {
    let query = supabase
      .from('company_timeline')
      .select('*, users!performed_by(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (viewerLayer === 'base') {
      query = query.in('visibility_scope', ['all_roles', 'base_tpr_and_above']);
    } else if (viewerLayer === 'comm') {
      query = query.in('visibility_scope', ['all_roles', 'base_tpr_and_above', 'communication_tpr_and_above']);
    } else if (viewerLayer === 'admin') {
      query = query.in('visibility_scope', ['all_roles', 'base_tpr_and_above', 'communication_tpr_and_above', 'head_tpr_and_above', 'admin_only']);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('[Timeline Service] Failed to fetch timeline:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[Timeline Service] Exception while fetching timeline:', err);
    return [];
  }
}
