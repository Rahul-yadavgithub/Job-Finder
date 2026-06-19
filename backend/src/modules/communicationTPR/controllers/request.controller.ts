import { Response } from 'express';
import { RequestService } from '../services/request.service';
import { CommunicationTPRRequest } from '../types';

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
}
