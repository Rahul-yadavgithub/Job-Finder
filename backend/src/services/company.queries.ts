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
    query = query.eq('base_status', status);
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
  const { data, error } = await supabase
    .from('company_status')
    .select('*, companies!inner(*)')
    .eq('branch_id', branchId)
    .eq('locked', false)
    .or(`base_status.eq.not_contacted,next_followup_date.lte.${currentDate}`)
    .order('next_followup_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function getDashboardCounts(branchId: string) {
  // Supabase JS does not natively support single-query COUNT FILTER without RPC.
  // Using parallel head-only requests to emulate it efficiently.
  const currentDate = new Date().toISOString().split('T')[0];

  const [totalRes, notContactedRes, interestedRes, notConfirmedRes, followupDueRes] = await Promise.all([
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).eq('base_status', 'not_contacted'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).or('base_status.eq.interested,locked.eq.true'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).eq('locked', false).in('base_status', ['call_again', 'not_available', 'rejected']),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).eq('locked', false).lte('next_followup_date', currentDate)
  ]);

  return {
    total: totalRes.count || 0,
    not_contacted: notContactedRes.count || 0,
    interested_count: interestedRes.count || 0,
    not_confirmed_count: notConfirmedRes.count || 0,
    followup_due: followupDueRes.count || 0
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
  if (!rows.length) return { inserted: 0, skipped: 0 };

  const payload = rows.map(r => ({
    ...r,
    branch_id: branchId,
    created_by: userId
  }));

  const { data: insertedCompanies, error: insertError } = await supabase
    .from('companies')
    .upsert(payload, { onConflict: 'company_name,branch_id', ignoreDuplicates: true })
    .select('id');

  if (insertError) throw insertError;

  if (insertedCompanies && insertedCompanies.length > 0) {
    const statusPayload = insertedCompanies.map(c => ({
      company_id: c.id,
      branch_id: branchId
    }));
    const { error: statusError } = await supabase
      .from('company_status')
      .insert(statusPayload);
    if (statusError) throw statusError;
  }

  return {
    inserted: insertedCompanies?.length || 0,
    skipped: rows.length - (insertedCompanies?.length || 0)
  };
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
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('mid_status', 'accepted'),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('mid_status', 'pending_review').eq('locked', true),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).is('mid_status', null).eq('locked', false).eq('base_status', 'interested'),
    supabase.from('companies').select('*', { count: 'exact', head: true }).gte('created_at', `${currentDate}T00:00:00.000Z`),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).not('top_status', 'is', null)
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
  filter?: 'confirmed' | 'pending' | 'newly_added' | 'all';
  search?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}) {
  let query = supabase
    .from('companies')
    .select(`
      id, company_name, hr_name, email, phone_number, data_source, created_at,
      company_status(base_status, mid_status, top_status, locked, next_followup_date),
      branches(name),
      users!created_by(name),
      status_history(new_status, changed_at)
    `, { count: 'exact' });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  if (search) {
    query = query.ilike('company_name', `%${search}%`);
  }

  if (filter === 'confirmed') {
    query = query.eq('company_status.mid_status', 'accepted');
  } else if (filter === 'pending') {
    query = query.eq('company_status.mid_status', 'pending_review');
  } else if (filter === 'newly_added') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query = query.gte('created_at', sevenDaysAgo.toISOString());
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
      branch_name: row.branches?.name,
      added_by_name: row.users?.name,
      latest_status,
      last_updated
    };
  });

  // Since PostgREST inner joins on relationship filtering are sometimes finicky in JS client depending on version, 
  // filtering out rows where the relationship is null handles cases where `.eq('company_status.mid_status', ...)` returned empty arrays for company_status.
  let filteredRows = rows;
  if (filter === 'confirmed') {
    filteredRows = rows.filter(r => r.mid_status === 'accepted');
  } else if (filter === 'pending') {
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
