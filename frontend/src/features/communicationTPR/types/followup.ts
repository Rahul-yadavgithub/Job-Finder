export type FollowUpPriority = 'Low' | 'Medium' | 'High';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export interface FollowUp {
  id: string;
  companyId: string;
  companyName?: string;
  assignedTo: string;
  assignedToName?: string;
  followUpDate: string;
  followUpTime?: string;
  reason: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpInput {
  followUpDate: string;
  followUpTime?: string;
  reason: string;
  priority: FollowUpPriority;
}
