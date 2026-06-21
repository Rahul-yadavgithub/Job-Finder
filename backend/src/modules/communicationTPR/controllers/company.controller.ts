import { Response } from 'express';
import { CompanyService } from '../services/company.service';
import { CommunicationTPRRequest } from '../types';
import { appendTimeline, getTimeline } from '../../../services/timeline.service';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  getInterestedCompanies = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { page, limit, search, branchId } = req.query;
      
      const filters = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        search: search as string,
        branchId: branchId as string
      };

      const result = await this.companyService.getInterestedCompanies(filters);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      console.error('getInterestedCompanies Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch companies' });
    }
  };

  getCompanyDetail = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await this.companyService.getCompanyDetail(id as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getCompanyDetail Error:', error);
      if (error.code === 'PGRST116') {
        res.status(404).json({ success: false, message: 'Company not found' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to fetch company details' });
      }
    }
  };

  getBranches = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const data = await this.companyService.getBranches();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getBranches Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch branches' });
    }
  };

  updateStage = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await this.companyService.updateMidStatus(id as string, status);
      
      let eventType = 'status_updated';
      if (status === 'accepted') eventType = 'accepted_by_comm_tpr';
      else if (status === 'revoked') eventType = 'reverted_to_branch';
      
      await appendTimeline({
        companyId: id as string,
        assignmentId: data.id,
        eventType,
        performedBy: req.user?.userId,
        performedByLayer: 'comm',
        title: `Communication TPR marked status as ${status}`,
        visibilityScope: status === 'revoked' ? 'all_roles' : 'communication_tpr_and_above'
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('updateStage Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update pipeline stage' });
    }
  };

  transferToHead = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const data = await this.companyService.transferToHead(id as string, req.user.userId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('transferToHead Error:', error);
      res.status(500).json({ success: false, message: 'Failed to transfer company to Head Portal' });
    }
  };

  getCompanyTimeline = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const events = await getTimeline(id as string, 'comm');
      res.status(200).json({ success: true, data: events });
    } catch (error: any) {
      console.error('getCompanyTimeline Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch company timeline' });
    }
  };
}
