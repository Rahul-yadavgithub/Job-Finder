import { Response } from 'express';
import { RequestService } from '../services/request.service';
import { CommunicationTPRRequest } from '../types';
import { appendTimeline } from '../../../services/timeline.service';

export class RequestController {
  private requestService: RequestService;

  constructor() {
    this.requestService = new RequestService();
  }

  getCompanyRequests = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;
      const data = await this.requestService.getRequestsByCompany(companyId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getCompanyRequests Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
  };

  getAllRequests = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const data = await this.requestService.getAllRequests();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getAllRequests Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch queue' });
    }
  };

  getPendingApprovals = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const data = await this.requestService.getPendingApprovals();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getPendingApprovals Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
    }
  };


  createRequest = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      
      const { companyId } = req.params;
      const input = { ...req.body, companyId };
      
      const data = await this.requestService.createRequest(input, req.user.userId);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error('createRequest Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create request' });
    }
  };

  updateDraft = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.requestService.updateDraft(id as string, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('updateDraft Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update draft' });
    }
  };

  submitForApproval = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.requestService.submitForApproval(id as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('submitForApproval Error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit for approval' });
    }
  };

  updateRequestStatus = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await this.requestService.updateRequestStatus(id as string, { status });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('updateRequestStatus Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update request status' });
    }
  };

  approveAndSendRequest = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.requestService.approveAndSendRequest(id as string);
      
      let eventType = 'custom_document_sent';
      if (data.requestType === 'brochure' || data.requestType === 'institute_brochure' || data.requestType === 'branch_brochure') eventType = 'brochure_sent';
      else if (data.requestType === 'jnf_form') eventType = 'jnf_sent';

      await appendTimeline({
        companyId: data.companyId,
        eventType,
        performedBy: req.user?.userId,
        performedByLayer: 'comm',
        title: `Sent ${data.requestType} to company`,
        isVisibleToComm: true,
        isVisibleToAdmin: true
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('approveAndSendRequest Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to approve and send request' });
    }
  };

  rejectRequest = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.requestService.rejectRequest(id as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('rejectRequest Error:', error);
      res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
  };
}
