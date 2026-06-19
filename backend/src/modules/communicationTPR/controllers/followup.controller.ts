import { Response } from 'express';
import { FollowUpService } from '../services/followup.service';
import { CommunicationTPRRequest } from '../types';

export class FollowUpController {
  private followUpService: FollowUpService;

  constructor() {
    this.followUpService = new FollowUpService();
  }

  getMyFollowUps = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const data = await this.followUpService.getMyFollowUps(req.user.userId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getMyFollowUps Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch follow-ups' });
    }
  };

  getCompanyFollowUps = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;
      const data = await this.followUpService.getCompanyFollowUps(companyId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getCompanyFollowUps Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch company follow-ups' });
    }
  };

  createFollowUp = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { companyId } = req.params;
      const input = { ...req.body, companyId };
      const data = await this.followUpService.createFollowUp(input, req.user.userId);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error('createFollowUp Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create follow-up' });
    }
  };

  updateFollowUpStatus = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await this.followUpService.updateFollowUpStatus(id as string, { status });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('updateFollowUpStatus Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update follow-up status' });
    }
  };
}
