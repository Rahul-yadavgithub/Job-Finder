export type ActivityType = 'call' | 'email' | 'linkedin' | 'note' | 'status_change' | 'follow_up' | 'brochure' | 'transfer' | 'communication_request' | 'transferred_to_head';

export interface CompanyActivity {
  id: string;
  companyId: string;
  userId?: string;
  userName?: string;
  activityType: ActivityType;
  notes?: string;
  metadata?: any;
  createdAt: string;
}

export interface CreateActivityInput {
  activityType: 'call' | 'email' | 'linkedin' | 'note' | 'follow_up';
  notes: string;
  metadata?: any;
}
