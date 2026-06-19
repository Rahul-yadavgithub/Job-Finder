import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import {
  getDashboardCounts,
  getCompaniesByBranch,
  getTodayCompaniesByBranch,
  insertCompanyBatch,
  CompanyInsert
} from '../services/company.queries';
import { applyStatusUpdate } from '../services/statusUpdate.service';
import { AuthRequest } from '../types/auth.types';
import xlsx from 'xlsx';
import Settings from '../models/Settings';
import { googleSheetService } from '../services/google/GoogleSheetProvider';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counts = await getDashboardCounts(req.user!.branchId!);
    res.status(200).json({ success: true, data: counts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await getCompaniesByBranch({
      branchId: req.user!.branchId!,
      status: status as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getTodayCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await getTodayCompaniesByBranch(req.user!.branchId!);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { base_status, notes, next_followup_date } = req.body;
    
    if (!['interested', 'rejected', 'call_again', 'not_available'].includes(base_status)) {
      res.status(400).json({ success: false, message: 'Invalid base_status' });
      return;
    }

    const result = await applyStatusUpdate({
      companyId: req.params.id as string,
      userId: req.user!.userId,
      layer: 'base',
      newStatus: base_status,
      notes,
      nextFollowupDate: next_followup_date,
      branchId: req.user!.branchId!
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.message === 'Access denied' || error.message?.includes('locked') ? 403 : 500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};

export const importCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet);

    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'Empty CSV' });
      return;
    }

    const header = Object.keys(rows[0]).map(k => k.toLowerCase());
    const required = ['company_name', 'hr_name', 'email', 'phone_number'];
    const missing = required.filter(col => !header.includes(col));

    if (missing.length > 0) {
      res.status(400).json({ success: false, message: 'Missing columns', missing });
      return;
    }

    const inserts: CompanyInsert[] = rows.map((r: any) => {
      const getVal = (key: string) => {
        const matchingKey = Object.keys(r).find(k => k.toLowerCase() === key);
        return matchingKey ? r[matchingKey] : undefined;
      };
      
      return {
        company_name: getVal('company_name')?.toString().trim() || '',
        hr_name: getVal('hr_name')?.toString().trim(),
        email: getVal('email')?.toString().trim(),
        phone_number: getVal('phone_number')?.toString().trim(),
        description: getVal('description')?.toString().trim(),
        data_source: 'csv_import' as const
      };
    }).filter((r: any) => r.company_name);

    const result = await insertCompanyBatch(inserts, req.user!.userId, req.user!.branchId!);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const syncSheet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: branch, error } = await supabase
      .from('branches')
      .select('sheet_tab_name')
      .eq('id', req.user!.branchId!)
      .single();

    if (error || !branch || !branch.sheet_tab_name) {
      res.status(400).json({ success: false, message: 'Branch sheet_tab_name not found' });
      return;
    }

    const settings = await Settings.findOne();
    if (!settings || !settings.currentAcademicYearSheetId) {
      res.status(400).json({ success: false, message: 'Google Sheets ID not configured in settings' });
      return;
    }

    const rows = await googleSheetService.fetchInboundData(
      settings.currentAcademicYearSheetId, 
      branch.sheet_tab_name
    );

    if (!rows || rows.length === 0) {
      res.status(200).json({ success: true, data: { inserted: 0, skipped: 0 }, message: 'No data found in sheet' });
      return;
    }

    const header = rows[0].map(h => h.toLowerCase().trim());
    const inserts: CompanyInsert[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const companyName = row[0]?.trim();
      if (!companyName) continue;

      inserts.push({
        company_name: companyName,
        hr_name: row[1]?.trim() || undefined,
        phone_number: row[2]?.trim() || undefined,
        email: row[3]?.trim() || undefined,
        description: row[6]?.trim() || undefined,
        data_source: 'sheet_sync'
      });
    }

    const result = await insertCompanyBatch(inserts, req.user!.userId, req.user!.branchId!);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getSheetUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.currentAcademicYearSheetId) {
      res.status(400).json({ success: false, message: 'Google Sheets ID not configured in settings' });
      return;
    }
    
    res.status(200).json({ 
      success: true, 
      data: { url: `https://docs.google.com/spreadsheets/d/${settings.currentAcademicYearSheetId}/edit` } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getSyncHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Currently no persistent sync_history table for branches, returning empty array
    // To be implemented fully when Supabase schema for sync history is added
    res.status(200).json({ success: true, data: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
