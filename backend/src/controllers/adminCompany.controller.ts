import { Response } from 'express';
import { AdminRequest } from '../types/admin.types';
import { 
  getAdminCompanyStats, 
  getAdminCompanyList, 
  getCompanyTimeline, 
  getFullCompanyDetail 
} from '../services/company.queries';

export const getCompanyStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await getAdminCompanyStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('getCompanyStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCompanies = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { filter, search, branchId, page, limit } = req.query;
    
    const params = {
      filter: filter as any,
      search: search as string | undefined,
      branchId: branchId as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    };

    const result = await getAdminCompanyList(params);
    
    res.status(200).json({ 
      success: true, 
      data: result.rows,
      meta: {
        total: result.total,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(result.total / params.limit)
      }
    });
  } catch (error) {
    console.error('getCompanies Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCompanyDetail = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // We already have getFullCompanyDetail from the previous TPR setup, but it fetches contact logs and HR contacts.
    // We can use that, and additionally append the detailed timeline with user names.
    const company = await getFullCompanyDetail(id);
    
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    const timeline = await getCompanyTimeline(id);
    
    // Overwrite the status_history with the enriched timeline (which includes user names)
    company.status_history = timeline;

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('getCompanyDetail Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
