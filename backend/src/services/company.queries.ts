import { supabase } from '../config/supabase';

export interface CompanyInsert {
  company_name: string;
  hr_name?: string;
  email?: string;
  phone_number?: string;
  description?: string;
  data_source?: 'manual' | 'csv_import' | 'sheet_sync' | 'scan';
}

export async function getCompanyById(companyId: string, branchId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*, company_status(*)')
    .eq('id', companyId)
    .eq('branch_id', branchId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getCompaniesByBranch({
  branchId,
  status,
  search,
  page = 1,
  limit = 20
}: {
  branchId: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  let query = supabase
    .from('company_status')
    .select('*, companies!inner(*)', { count: 'exact' })
    .eq('branch_id', branchId)
    .eq('locked', false);

  if (status) {
    if (status === 'pending') {
      query = query.or('base_status.eq.not_contacted,base_status.eq.pending,base_status.is.null');
    } else if (status === 'reverted') {
      query = query.eq('mid_status', 'revoked');
    } else {
      query = query.eq('base_status', status);
    }
  }
  if (search) {
    query = query.ilike('companies.company_name', `%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { rows: data, total: count || 0 };
}

export async function getTodayCompaniesByBranch(branchId: string) {
  const currentDate = new Date().toISOString().split('T')[0];
  let query = supabase
    .from('company_status')
    .select('*, companies!inner(*)')
    .eq('branch_id', branchId)
    .eq('locked', false)
    .eq('base_status', 'call_again') // "whose status and followup data is mentioned"
    .order('next_followup_date', { ascending: true, nullsFirst: false });

  // Exclude reverted companies. 
  // In Supabase js, to do .neq with a null column, we must use an 'or' statement, 
  // or explicitly filter using .is('mid_status', null) if that's easier.
  // Actually, .neq('mid_status', 'revoked') should work as long as mid_status is not null. 
  // Better: .or('mid_status.neq.revoked,mid_status.is.null')
  query = query.or('mid_status.neq.revoked,mid_status.is.null');

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDashboardCounts(branchId: string) {
  // Supabase JS does not natively support single-query COUNT FILTER without RPC.
  // Using parallel head-only requests to emulate it efficiently.
  const currentDate = new Date().toISOString().split('T')[0];

  const [totalRes, pendingRes, revertedRes, callAgainRes] = await Promise.all([
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).or('base_status.eq.not_contacted,base_status.eq.pending,base_status.is.null'), // "status is either nothing"
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).eq('mid_status', 'revoked'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).eq('base_status', 'call_again').or('mid_status.neq.revoked,mid_status.is.null')
  ]);

  return {
    total: totalRes.count || 0,
    not_contacted: pendingRes.count || 0, // Maps to Not Confirmed
    reverted_count: revertedRes.count || 0,
    not_confirmed_count: pendingRes.count || 0, // Using same value for Not Confirmed
    followup_due: callAgainRes.count || 0 // Maps to Contact Today
  };
}

export async function insertCompany(data: CompanyInsert, userId: string, branchId: string) {
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      ...data,
      branch_id: branchId,
      created_by: userId
    })
    .select()
    .single();

  if (companyError) throw companyError;

  const { data: status, error: statusError } = await supabase
    .from('company_status')
    .insert({
      company_id: company.id,
      branch_id: branchId
    })
    .select()
    .single();

  if (statusError) throw statusError;

  return { ...company, company_status: status };
}

export async function insertCompanyBatch(rows: CompanyInsert[], userId: string, branchId: string) {
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const { data: result, error } = await supabase.rpc('insert_company_safe', {
      p_company_name: row.company_name,
      p_branch_id: branchId,
      p_hr_name: row.hr_name || null,
      p_email: row.email || null,
      p_phone_number: row.phone_number || null,
      p_description: row.description || null,
      p_data: { created_by: userId, data_source: row.data_source || 'scan' }
    });

    if (error) {
      console.error('Error inserting company:', error);
      skipped++;
    } else if (result && result.is_duplicate) {
      skipped++;
    } else {
      inserted++;
    }
  }

  return { inserted, skipped };
}

export async function syncCompanyBatchFromSheet(rows: CompanyInsert[], userId: string, branchId: string) {
  let updated = 0;
  let skipped = 0;

  const { data: branchData } = await supabase.from('branches').select('branch_group').eq('id', branchId).single();
  const branchGroup = branchData?.branch_group;
  if (!branchGroup) throw new Error('Branch group not found');

  for (const row of rows) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('branch_group_key', branchGroup)
      .eq('status', 'active')
      .ilike('company_name', row.company_name.trim())
      .limit(1)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('companies')
        .update({
          hr_name: row.hr_name || null,
          email: row.email || null,
          phone_number: row.phone_number || null,
          description: row.description || null
        })
        .eq('id', existing.id);
        
      if (!error) updated++;
      else skipped++;
    } else {
      const { data: result, error } = await supabase.rpc('insert_company_safe', {
        p_company_name: row.company_name,
        p_branch_id: branchId,
        p_hr_name: row.hr_name || null,
        p_email: row.email || null,
        p_phone_number: row.phone_number || null,
        p_description: row.description || null,
        p_data: { created_by: userId, data_source: row.data_source || 'sheet_sync' }
      });
      if (!error && result && !result.is_duplicate) updated++;
      else skipped++;
    }
  }

  return { updated, skipped };
}

export async function getMidDashboardCounts() {
  const currentDate = new Date().toISOString().split('T')[0];

  const [pendingRes, inProcessRes, acceptedRes, rejectedRes, revokedTodayRes] = await Promise.all([
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('mid_status', 'pending_review'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('mid_status', 'in_process'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('mid_status', 'accepted'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('mid_status', 'rejected'),
    supabase.from('company_status')
      .select('*', { count: 'exact', head: true })
      .eq('locked', false)
      .gte('updated_at', `${currentDate}T00:00:00.000Z`)
  ]);

  return {
    pending_review: pendingRes.count || 0,
    in_process: inProcessRes.count || 0,
    accepted: acceptedRes.count || 0,
    mid_rejected: rejectedRes.count || 0,
    revoked_today: revokedTodayRes.count || 0
  };
}

export async function getLockedCompanies({
  mid_status,
  search,
  page = 1,
  limit = 20
}: {
  mid_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  let query = supabase
    .from('company_status')
    .select('*, companies!inner(*, branches(name), users!created_by(name))', { count: 'exact' })
    .eq('locked', true);

  if (mid_status) {
    query = query.eq('mid_status', mid_status);
  }
  if (search) {
    query = query.ilike('companies.company_name', `%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('locked_at', { ascending: true })
    .range(from, to);

  if (error) throw error;

  const rows = data.map((row: any) => ({
    ...row,
    companies: {
      ...row.companies,
      branch_name: row.companies?.branches?.name,
      tpr_name: row.companies?.users?.name
    }
  }));

  return { rows, total: count || 0 };
}

export async function getTodayMidContacts() {
  const currentDate = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('company_status')
    .select('*, companies!inner(*, branches(name))')
    .eq('mid_status', 'in_process')
    .lte('next_followup_date', currentDate)
    .order('next_followup_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function getFullCompanyDetail(companyId: string) {
  const { data: company, error } = await supabase
    .from('companies')
    .select('*, branches(name), users!created_by(name), company_status(*), status_history(*), contact_log(*), hr_contacts(*)')
    .eq('id', companyId)
    .single();

  if (error || !company) return null;

  if (company.status_history) {
    company.status_history.sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }
  if (company.contact_log) {
    company.contact_log.sort((a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  }

  return company;
}

export async function getAdminCompanyStats() {
  const currentDate = new Date().toISOString().split('T')[0];

  const [
    totalRes,
    confirmedRes,
    pendingMidRes,
    newlyInterestedRes,
    addedTodayRes,
    reachedTopRes
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('brochure_completed', true),
    supabase.from('drive_details').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('*, company_status!inner(top_status)', { count: 'exact', head: true }).eq('brochure_completed', true).not('company_status.top_status', 'is', null).neq('company_status.top_status', 'completed'),
    supabase.from('companies').select('*, company_status!inner(top_status)', { count: 'exact', head: true }).eq('brochure_completed', true).is('company_status.top_status', null),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('brochure_completed', true).gte('brochure_completed_at', `${currentDate}T00:00:00.000Z`),
    supabase.from('companies').select('*, company_status!inner(top_status)', { count: 'exact', head: true }).eq('brochure_completed', true).not('company_status.top_status', 'is', null)
  ]);

  return {
    total: totalRes.count || 0,
    confirmed: confirmedRes.count || 0,
    pending_mid_review: pendingMidRes.count || 0,
    newly_interested: newlyInterestedRes.count || 0,
    added_today: addedTodayRes.count || 0,
    reached_top_level: reachedTopRes.count || 0
  };
}

export async function getAdminCompanyList({
  filter,
  search,
  branchId,
  page = 1,
  limit = 20
}: {
  filter?: 'confirmed' | 'pending' | 'newly_added' | 'new' | 'all';
  search?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}) {
  let query = supabase
    .from('companies')
    .select(`
      id, company_name, hr_name, email, phone_number, data_source, created_at, brochure_completed, brochure_completed_at,
      company_status!inner(base_status, mid_status, top_status, locked, next_followup_date, interested_by_name, interested_at),
      branches(name),
      users!created_by(name),
      status_history(new_status, changed_at)
    `, { count: 'exact' })
    .eq('brochure_completed', true);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  if (search) {
    query = query.ilike('company_name', `%${search}%`);
  }

  if (filter === 'confirmed') {
    query = query.eq('company_status.top_status', 'completed');
  } else if (filter === 'pending') {
    // mid_status is accepted (meaning it passed head review), but top_status is not completed
    query = query.eq('company_status.mid_status', 'accepted')
                 .neq('company_status.top_status', 'completed');
  } else if (filter === 'new' || filter === 'newly_added') {
    // waiting for head review
    query = query.eq('company_status.mid_status', 'pending_review');

  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const rows = data.map((row: any) => {
    let latest_status = null;
    let last_updated = null;

    if (row.status_history && row.status_history.length > 0) {
      row.status_history.sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
      latest_status = row.status_history[0].new_status;
      last_updated = row.status_history[0].changed_at;
    }

    return {
      id: row.id,
      company_name: row.company_name,
      hr_name: row.hr_name,
      email: row.email,
      phone_number: row.phone_number,
      data_source: row.data_source,
      created_at: row.created_at,
      base_status: row.company_status?.[0]?.base_status,
      mid_status: row.company_status?.[0]?.mid_status,
      top_status: row.company_status?.[0]?.top_status,
      locked: row.company_status?.[0]?.locked,
      next_followup_date: row.company_status?.[0]?.next_followup_date,
      interested_by_name: row.company_status?.[0]?.interested_by_name,
      interested_at: row.company_status?.[0]?.interested_at,
      branch_name: row.branches?.name,
      added_by_name: row.users?.name,
      brochure_completed: row.brochure_completed,
      brochure_completed_at: row.brochure_completed_at,
      latest_status,
      last_updated
    };
  });

  // Since PostgREST inner joins on relationship filtering are sometimes finicky in JS client depending on version, 
  // filtering out rows where the relationship is null handles cases where `.eq('company_status.top_status', ...)` returned empty arrays for company_status.
  let filteredRows = rows;
  if (filter === 'confirmed') {
    filteredRows = rows.filter(r => r.top_status === 'completed');
  } else if (filter === 'pending') {
    filteredRows = rows.filter(r => r.mid_status === 'accepted' && r.top_status !== 'completed');
  } else if (filter === 'new' || filter === 'newly_added') {
    filteredRows = rows.filter(r => r.mid_status === 'pending_review');
  }

  return { rows: filteredRows, total: count || 0 };
}

export async function getCompanyTimeline(companyId: string) {
  const { data, error } = await supabase
    .from('status_history')
    .select('*, users!changed_by(name)')
    .eq('company_id', companyId)
    .order('changed_at', { ascending: true });

  if (error) throw error;

  return data.map((row: any) => ({
    ...row,
    changed_by_name: row.users?.name
  }));
}
