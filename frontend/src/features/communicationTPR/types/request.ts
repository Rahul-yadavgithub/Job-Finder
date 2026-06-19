export type RequestType = 'brochure' | 'officialCommunication';
export type RequestStatus = 'pending' | 'submitted' | 'completed' | 'rejected';

export interface CommunicationRequest {
  id: string;
  companyId: string;
  requestedBy: string;
  requestedByName?: string;
  requestType: RequestType;
  status: RequestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
}

export interface CreateRequestInput {
  requestType: RequestType;
  notes?: string;
}
