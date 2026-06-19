import { RequestRepository } from '../repositories/request.repository';
import { CreateRequestInput, UpdateRequestStatusInput, CommunicationRequest } from '../types/request.types';

export class RequestService {
  private requestRepository: RequestRepository;

  constructor() {
    this.requestRepository = new RequestRepository();
  }

  private formatRequest(row: any): CommunicationRequest {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    return {
      id: row.id,
      companyId: row.company_id,
      requestedBy: row.requested_by,
      requestedByName: user?.name,
      requestType: row.request_type,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      companyName: company?.company_name
    };
  }

  async getRequestsByCompany(companyId: string): Promise<CommunicationRequest[]> {
    const data = await this.requestRepository.getRequestsByCompany(companyId);
    return data.map(this.formatRequest);
  }

  async getAllRequests(): Promise<CommunicationRequest[]> {
    const data = await this.requestRepository.getAllRequests();
    return data.map(this.formatRequest);
  }

  async createRequest(input: CreateRequestInput, userId: string): Promise<CommunicationRequest> {
    if (!input.companyId || !input.requestType) {
      throw new Error('Missing required fields');
    }
    const data = await this.requestRepository.createRequest(input, userId);
    return this.formatRequest(data);
  }

  async updateRequestStatus(requestId: string, input: UpdateRequestStatusInput): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateRequestStatus(requestId, input);
    return this.formatRequest(data);
  }
}
