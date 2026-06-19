export interface CompanyActivity {
  id: string;
  companyId: string;
  userId?: string;
  userName?: string;
  activityType: 'call' | 'email' | 'linkedin' | 'note' | 'status_change' | 'follow_up' | 'brochure' | 'transfer';
  notes?: string;
  metadata?: any;
  createdAt: string;
}

export interface CreateActivityInput {
  companyId: string;
  activityType: 'call' | 'email' | 'linkedin' | 'note' | 'follow_up';
  notes: string;
  metadata?: any;
}
