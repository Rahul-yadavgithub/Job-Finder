export type RequestType = 'institute_brochure' | 'branch_brochure' | 'jnf_form' | 'custom' | 'brochure' | 'officialCommunication';
export type RequestStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected' | 'cancelled' | 'completed' | 'submitted' | 'pending';

export interface CommunicationRequest {
  id: string;
  companyId: string;
  requestedBy: string;
  requestedByName?: string;
  requestType: RequestType;
  status: RequestStatus;
  notes?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  templateId?: string;
  targetBranchId?: string;
  urgency?: 'normal' | 'urgent';
  createdAt: string;
  updatedAt: string;
  companyName?: string;
}

export interface CreateRequestInput {
  companyId: string;
  requestType: RequestType;
  templateId?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  notes?: string;
}

export interface UpdateDraftInput {
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  urgency?: 'normal' | 'urgent';
}

export interface UpdateRequestStatusInput {
  status: RequestStatus;
}
