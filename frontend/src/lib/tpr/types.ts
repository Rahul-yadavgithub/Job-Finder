export interface User {
  userId: string;
  role: string;
  branchId: string;
  branchName: string;
}

export interface Company {
  id: string;
  company_name: string;
  hr_name: string | null;
  hr_email: string | null;
  phone_number: string | null;
  website: string | null;
  branch_id: string;
  base_status: string; // the active status for the current tier
  notes: string | null;
  next_followup_date: string | null;
  status_updated_at: string;
  data_source: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
}

export interface DashboardStats {
  total_companies: number;
  not_contacted_count: number;
  interested_count: number;
  follow_up_due_count: number;
  locked_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
