import { supabase } from '../../../config/supabase';
import { CreateActivityInput } from '../types/activity.types';

export class ActivityRepository {
  async getActivitiesByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('company_activities')
      .select('*, users(name, branches(name))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createActivity(input: CreateActivityInput, userId: string) {
    // If the activity is a call/email/linkedin, we should ALSO log it to contact_log
    // so the business logic layer remains the source of truth, and the DB trigger
    // will auto-populate the company_activities table.
    
    if (['call', 'email', 'linkedin'].includes(input.activityType)) {
      const { data, error } = await supabase
        .from('contact_log')
        .insert({
          company_id: input.companyId,
          logged_by: userId,
          method: input.activityType,
          notes: input.notes,
          outcome: input.metadata?.outcome
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // We return a mock activity format since the trigger handles the actual insert asynchronously
      return {
        id: 'pending-trigger',
        companyId: input.companyId,
        userId,
        activityType: input.activityType,
        notes: input.notes,
        metadata: input.metadata,
        createdAt: new Date().toISOString()
      };
    } else {
      // For pure notes or follow_ups, just insert directly into company_activities
      const { data, error } = await supabase
        .from('company_activities')
        .insert({
          company_id: input.companyId,
          user_id: userId,
          activity_type: input.activityType,
          notes: input.notes,
          metadata: input.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
}
