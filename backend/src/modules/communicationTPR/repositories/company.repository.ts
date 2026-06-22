import { supabase } from '../../../config/supabase';
import { GetCompaniesFilters } from '../types/company.types';

export class CompanyRepository {
  async getInterestedCompanies(filters: GetCompaniesFilters) {
    const { page = 1, limit = 20, search, branchId } = filters;
    
    let query = supabase
      .from('companies')
      .select(`
        id, company_name, hr_name, email, phone_number,
        company_status!inner(base_status, mid_status, updated_at, original_marked_by, users!company_status_original_marked_by_fkey(name)),
        branches!inner(id, name),
        users!created_by(name),
        status_history(new_status, changed_at)
      `, { count: 'exact' })
      .eq('company_status.base_status', 'interested')
      .eq('brochure_completed', false);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (search) {
      query = query.ilike('company_name', `%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return { data, count: count || 0 };
  }

  async getCompanyById(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id, company_name, hr_name, email, phone_number, description, data_source, created_at,
        company_status(base_status, mid_status, updated_at, locked, original_marked_by, users!company_status_original_marked_by_fkey(name)),
        branches(id, name),
        users!created_by(name),
        status_history(new_status, changed_at, users!changed_by(name)),
        contact_log(*),
        hr_contacts(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getBranches() {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');
      
    if (error) throw error;
    return data;
  }

  async updateMidStatus(companyId: string, status: string) {
    const payload: any = { mid_status: status, updated_at: new Date().toISOString() };
    if (status === 'revoked') {
      payload.locked = false;
      payload.locked_by = null;
      payload.locked_at = null;
      payload.base_status = 'call_again';
    }

    const { data, error } = await supabase
      .from('company_status')
      .update(payload)
      .eq('company_id', companyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async transferToHead(companyId: string, userId: string) {
    // 1. Update company_status
    const { data, error } = await supabase
      .from('company_status')
      .update({ 
        mid_status: 'transferred_to_head',
        locked: true,
        locked_by: userId,
        locked_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .select()
      .single();
      
    if (error) throw error;

    // 2. Insert into company_activities
    const { error: activityError } = await supabase
      .from('company_activities')
      .insert({
        company_id: companyId,
        user_id: userId,
        activity_type: 'transferred_to_head',
        notes: 'Company transferred to Head Review Portal.',
        metadata: { transferred_by: userId }
      });

    if (activityError) throw activityError;

    return data;
  }

  async getDashboardStats() {
    const { data: companies, error } = await supabase
      .from('company_status')
      .select('mid_status, base_status, companies!inner(brochure_completed)');

    if (error) throw error;

    // EXACT LOGIC MATCH: Use the same query logic as the "Completed Queue" page
    const { count: confirmedCount } = await supabase
      .from('communication_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    let active = 0;
    let newIncoming = 0;
    let confirmed = confirmedCount || 0;

    for (const c of companies) {
      if (c.base_status !== 'interested') continue; // We only care about companies that reached the interested phase

      const isCompleted = (Array.isArray(c.companies) ? c.companies[0]?.brochure_completed : (c.companies as any)?.brochure_completed) || false;
      const status = c.mid_status;
      
      // If the brochure is completed, it's already counted in the Confirmed bucket above.
      if (isCompleted || status === 'accepted') {
        continue;
      }
      
      // 3. Rejected/Revoked: Pipeline ends (removed from active)
      if (status === 'rejected' || status === 'revoked') {
        continue;
      } 
      
      // 1. New Incoming: No action taken yet (pending_review)
      if (!status || status === 'interested' || status === 'pending_review') {
        newIncoming++;
        active++; // Active includes new companies
      } 
      // 4. Active: Drafted, sent to TPO staff (transferred_to_head), under communication, etc.
      else {
        active++;
      }
    }

    return { active, newIncoming, confirmed };
  }
}
