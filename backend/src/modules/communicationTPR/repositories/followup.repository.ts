import { supabase } from '../../../config/supabase';
import { CreateFollowUpInput, UpdateFollowUpStatusInput } from '../types/followup.types';

export class FollowUpRepository {
  async getFollowUpsByUser(userId: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, companies(company_name), users!assigned_to(name)')
      .eq('assigned_to', userId)
      .order('follow_up_date', { ascending: true })
      .order('follow_up_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getFollowUpsByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, companies(company_name), users!assigned_to(name)')
      .eq('company_id', companyId)
      .order('follow_up_date', { ascending: true })
      .order('follow_up_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createFollowUp(input: CreateFollowUpInput, userId: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        company_id: input.companyId,
        assigned_to: userId, // currently assigned to the creator, but could be selectable
        follow_up_date: input.followUpDate,
        follow_up_time: input.followUpTime || null,
        reason: input.reason,
        priority: input.priority || 'Medium',
        status: 'pending'
      })
      .select('*, companies(company_name), users!assigned_to(name)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateFollowUpStatus(followUpId: string, input: UpdateFollowUpStatusInput) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update({ status: input.status })
      .eq('id', followUpId)
      .select('*, companies(company_name), users!assigned_to(name)')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFollowUp(followUpId: string) {
    const { error } = await supabase
      .from('follow_ups')
      .delete()
      .eq('id', followUpId);

    if (error) throw error;
    return true;
  }
}
