import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import {
  getMidDashboardCounts,
  getLockedCompanies,
  getTodayMidContacts,
  getFullCompanyDetail
} from '../services/company.queries';
import { applyStatusUpdate } from '../services/statusUpdate.service';

export const getMidDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counts = await getMidDashboardCounts();
    res.status(200).json({ success: true, data: counts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getPendingCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page, limit } = req.query;
    const result = await getLockedCompanies({
      mid_status: 'pending_review',
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getAllMidCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mid_status, search, page, limit } = req.query;
    const result = await getLockedCompanies({
      mid_status: mid_status as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getCompanyDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const company = await getFullCompanyDetail(req.params.id as string);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }
    res.status(200).json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const updateMidStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mid_status, notes, next_followup_date } = req.body;

    if (!['in_process', 'accepted', 'rejected', 'revoked'].includes(mid_status)) {
      res.status(400).json({ success: false, message: 'Invalid mid_status' });
      return;
    }

    const result = await applyStatusUpdate({
      companyId: req.params.id as string,
      userId: req.user!.userId,
      layer: 'mid',
      newStatus: mid_status,
      notes,
      nextFollowupDate: next_followup_date
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.message === 'Company is not in mid-layer review' ? 403 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

export const getTodayContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getTodayMidContacts();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
