import { Response } from 'express';
import { ActivityService } from '../services/activity.service';
import { CommunicationTPRRequest } from '../types';

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  getCompanyActivities = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;
      const data = await this.activityService.getActivitiesByCompany(companyId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('getCompanyActivities Error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch activities' });
    }
  };

  createActivity = async (req: CommunicationTPRRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      
      const { companyId } = req.params;
      const input = { ...req.body, companyId };
      
      const data = await this.activityService.createActivity(input, req.user.userId);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error('createActivity Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create activity' });
    }
  };
}
