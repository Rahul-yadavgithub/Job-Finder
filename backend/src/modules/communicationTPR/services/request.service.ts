import { RequestRepository } from '../repositories/request.repository';
import { sendPlacementEmail } from '../../../services/email.service';
import { supabase } from '../../../config/supabase';
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

  async getPendingApprovals(): Promise<CommunicationRequest[]> {
    const data = await this.requestRepository.getPendingApprovals();
    return data.map(this.formatRequest);
  }


  async createRequest(input: CreateRequestInput, userId: string): Promise<CommunicationRequest> {
    if (!input.companyId || !input.requestType) {
      throw new Error('Missing required fields');
    }
    const data = await this.requestRepository.createRequest(input, userId);
    return this.formatRequest(data);
  }

  async updateDraft(requestId: string, input: any): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateDraft(requestId, input);
    return this.formatRequest(data);
  }

  async submitForApproval(requestId: string): Promise<CommunicationRequest> {
    const data = await this.requestRepository.submitForApproval(requestId);
    return this.formatRequest(data);
  }

  async updateRequestStatus(requestId: string, input: UpdateRequestStatusInput): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateRequestStatus(requestId, input);
    return this.formatRequest(data);
  }

  async approveAndSendRequest(requestId: string): Promise<CommunicationRequest> {
    // 1. Fetch Request details & Email Template attachment
    const requestDetails = await this.requestRepository.getRequestForEmail(requestId);
    
    if (!requestDetails) throw new Error('Request not found');
    if (requestDetails.status !== 'pending_approval') {
      throw new Error('Request must be in pending_approval state to approve and send');
    }

    if (!requestDetails.email_to || !requestDetails.email_subject || !requestDetails.email_body) {
      throw new Error('Email details are incomplete');
    }

    const templateData = requestDetails.email_templates;

    // 2. Fetch first follow-up rule to determine next_followup_date
    let nextFollowupDate = null;
    const { data: followupRules } = await supabase
      .from('comm_followup_rules')
      .select('wait_days')
      .eq('followup_number', 1)
      .single();

    if (followupRules && followupRules.wait_days) {
      const date = new Date();
      date.setDate(date.getDate() + followupRules.wait_days);
      nextFollowupDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // 3. Send email via NodeMailer
    await sendPlacementEmail({
      toEmail: requestDetails.email_to,
      subject: requestDetails.email_subject,
      bodyHtml: requestDetails.email_body,
      attachmentUrl: templateData?.attachment_url,
      attachmentFilename: templateData?.attachment_filename,
    });

    // 4. Update status to sent & set next_followup_date
    const data = await this.requestRepository.approveAndMarkSent(requestId, nextFollowupDate);
    return this.formatRequest(data);
  }

  async rejectRequest(requestId: string): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateRequestStatus(requestId, { status: 'rejected' });
    return this.formatRequest(data);
  }
}
