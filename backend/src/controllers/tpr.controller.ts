import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import {
  getDashboardCounts,
  getCompaniesByBranch,
  getTodayCompaniesByBranch,
  insertCompanyBatch,
  syncCompanyBatchFromSheet,
  CompanyInsert
} from '../services/company.queries';
import { applyStatusUpdate } from '../services/statusUpdate.service';
import { appendTimeline } from '../services/timeline.service';
import { AuthRequest } from '../types/auth.types';
import xlsx from 'xlsx';
import Settings from '../models/Settings';
import Company, { CompanyStatus } from '../models/Company';
import SyncJob from '../models/SyncJob';
import { googleSheetService } from '../services/google/GoogleSheetProvider';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fs = require("fs"); fs.writeFileSync("debug_dash.txt", JSON.stringify(req.user)); const counts = await getDashboardCounts(req.user!.branchId!);
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

    await appendTimeline({
      companyId: req.params.id as string,
      assignmentId: result.updated.id,
      eventType: base_status === 'interested' ? 'marked_interested' : 'status_updated',
      performedBy: req.user!.userId,
      performedByLayer: 'base',
      title: `Base status updated to ${base_status}`,
      description: notes,
      isVisibleToBase: true,
      isVisibleToComm: true,
      isVisibleToAdmin: true
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.message === 'Access denied' || error.message?.includes('locked') ? 403 : 500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};

export const getCompanyHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user!.role;
    
    const { data: statusData, error: statusError } = await supabase
      .from('company_status')
      .select('base_status, mid_status, top_status, locked')
      .eq('company_id', id)
      .single();

    if (statusError || !statusData) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    // Role-Based Visibility Checks
    if (userRole === 'branch_tpr') {
      if (statusData.base_status === 'interested' || statusData.locked) {
        res.status(200).json({ success: true, data: [], hidden: true, message: 'History hidden. Company has progressed to the next layer.' });
        return;
      }
    } else if (userRole === 'communication_tpr') {
      if (statusData.top_status || statusData.mid_status === 'confirmed') {
         res.status(200).json({ success: true, data: [], hidden: true, message: 'History hidden. Company has progressed to the top layer.' });
         return;
      }
    }

    let query = supabase
      .from('status_history')
      .select('*')
      .eq('company_id', id)
      .order('changed_at', { ascending: false });

    if (userRole === 'branch_tpr') {
      if (statusData.mid_status === 'revoked') {
        query = query.in('layer', ['base', 'mid']);
      } else {
        query = query.eq('layer', 'base');
      }
    } else if (userRole === 'communication_tpr') {
      query = query.in('layer', ['base', 'mid']);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json({ success: true, data, hidden: false });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const importCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!(req as any).file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const workbook = xlsx.read((req as any).file.buffer, { type: 'buffer' });
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

    const result = await syncCompanyBatchFromSheet(inserts, req.user!.userId, req.user!.branchId!);
    res.status(200).json({ success: true, data: { ...result, totalUpdated: result.updated } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const pushSync = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user!.branchId!;
    
    const { companyIds: targetCompanyIds } = req.body;
    
    // 1. Fetch pending companies from MongoDB
    const query: any = {
      assignedBranch: branchId,
      syncStatus: 'pending',
      status: CompanyStatus.APPROVED
    };
    if (targetCompanyIds && Array.isArray(targetCompanyIds) && targetCompanyIds.length > 0) {
      query._id = { $in: targetCompanyIds };
    }

    const pendingCompanies = await Company.find(query);

    if (!pendingCompanies || pendingCompanies.length === 0) {
      res.status(200).json({ success: true, message: 'No pending companies to sync', count: 0 });
      return;
    }

    // 2. Prepare inserts for Supabase
    const inserts: CompanyInsert[] = pendingCompanies.map(c => ({
      company_name: c.companyName,
      hr_name: c.hrName,
      email: c.hrEmail,
      phone_number: c.phoneNumber,
      description: c.description,
      data_source: 'scan'
    }));

    // 3. Insert into Supabase
    const result = await insertCompanyBatch(inserts, req.user!.userId, branchId);

    // 3.5. Insert into Google Sheets
    try {
      const { data: branch } = await supabase.from('branches').select('sheet_tab_name').eq('id', branchId).single();
      const settings = await Settings.findOne();
      
      if (branch?.sheet_tab_name && settings?.currentAcademicYearSheetId) {
        // Prepare rows for Google Sheets: [Company Name, HR Name, Phone, Email, _, _, Description]
        const sheetRows = pendingCompanies.map(c => [
          c.companyName || '',
          c.hrName || '',
          c.phoneNumber || '',
          c.hrEmail || '',
          '',
          '',
          c.description || ''
        ]);
        
        await googleSheetService.appendDataToSheet(
          settings.currentAcademicYearSheetId,
          branch.sheet_tab_name,
          sheetRows
        );
      }
    } catch (sheetError) {
      console.error('Failed to append to Google Sheets during pushSync:', sheetError);
    }

    // 4. Update MongoDB status
    const companyIds = pendingCompanies.map(c => c._id);
    await Company.updateMany(
      { _id: { $in: companyIds } },
      { $set: { syncStatus: 'synced', lastSynced: new Date() } }
    );

    // 5. Create SyncHistory record
    const syncHistory = await SyncJob.create({
      branchId: branchId,
      status: 'completed',
      totalRecords: pendingCompanies.length,
      syncedRecords: result.inserted,
      failedRecords: result.skipped,
      startedAt: new Date(),
      completedAt: new Date()
    });

    res.status(200).json({ success: true, data: result, history: syncHistory });
  } catch (error: any) {
    console.error('Push Sync Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getPendingSyncCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user!.branchId!;
    const companies = await Company.find({
      assignedBranch: branchId,
      syncStatus: 'pending',
      status: CompanyStatus.APPROVED
    }).sort({ updatedAt: -1 }).lean();
    
    res.status(200).json({ success: true, data: companies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const removePendingCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const branchId = req.user!.branchId!;
    
    const company = await Company.findOne({ _id: id, assignedBranch: branchId });
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found in pending queue' });
      return;
    }

    if (company.data_source === ('manual' as any)) {
      await Company.findByIdAndDelete(id);
    } else {
      company.status = CompanyStatus.REJECTED;
      company.syncStatus = undefined as any;
      await company.save();
    }

    res.status(200).json({ success: true, message: 'Company removed from pending queue' });
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
    const branchId = req.user!.branchId!;
    const history = await SyncJob.find({ branchId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
      
    const mappedHistory = history.map(h => ({
      id: h._id,
      timestamp: h.createdAt,
      count: h.syncedRecords,
      status: h.status
    }));

    res.status(200).json({ success: true, data: mappedHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const checkCompanyName = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    const branchId = req.user!.branchId!;
    
    // 1. Get the branch group
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('branch_group')
      .eq('id', branchId)
      .single();

    if (branchError || !branchData) {
      res.status(500).json({ success: false, message: 'Branch not found' });
      return;
    }

    const branchGroup = branchData.branch_group;

    // 2. Check if the normalized name exists in the same branch group
    const { data: existingCompany, error: searchError } = await supabase
      .from('companies')
      .select('id, company_name, hr_name, email, phone_number')
      .eq('branch_group_key', branchGroup)
      .eq('status', 'active')
      .ilike('company_name', name.trim())
      .limit(1)
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is PostgreSQL code for zero rows returned on .single()
      res.status(500).json({ success: false, message: searchError.message });
      return;
    }

    if (!existingCompany) {
      res.json({ exists: false });
      return;
    }

    res.json({
      exists: true,
      company: {
        _id: existingCompany.id,
        companyName: existingCompany.company_name,
      },
      hrContact: {
        name: existingCompany.hr_name,
        email: existingCompany.email,
        mobile: existingCompany.phone_number
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const addManualCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user!.branchId!;
    const { companyName, hrName, hrPhone, hrEmail, linkedinProfile } = req.body;

    if (!companyName) {
      res.status(400).json({ success: false, message: 'Company name is required' });
      return;
    }

    const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if it already exists in MongoDB
    let company = await Company.findOne({ 
      normalizedName,
      $or: [{ assignedBranch: branchId }, { assignedBranch: { $exists: false } }]
    });

    if (company) {
      // Update existing
      company.hrEmail = hrEmail || company.hrEmail;
      company.founderEmail = company.founderEmail || hrEmail; // Fallback
      if (hrName) company.hrName = hrName;
      if (hrPhone) company.phoneNumber = hrPhone;
      company.assignedBranch = branchId;
      company.status = CompanyStatus.APPROVED;
      company.syncStatus = 'pending';
      company.review_status = 'approved';
      await company.save();
    } else {
      // Create new
      company = new Company({
        companyName,
        normalizedName,
        hrName: hrName || undefined,
        phoneNumber: hrPhone || undefined,
        hrEmail: hrEmail || undefined,
        assignedBranch: branchId,
        status: CompanyStatus.APPROVED,
        syncStatus: 'pending',
        review_status: 'approved',
        data_source: 'manual',
        reviewed_by: req.user!.userId,
        reviewed_at: new Date(),
        confidenceScore: 100,
        placementScore: 0
      });
      await company.save();
    }

    res.status(200).json({ success: true, data: company });
  } catch (error: any) {
    console.error('Manual company add error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const previewCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!(req as any).file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const branchId = req.user!.branchId!;
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('branch_group')
      .eq('id', branchId)
      .single();

    if (branchError || !branchData) {
      res.status(500).json({ success: false, message: 'Branch not found' });
      return;
    }

    const branchGroup = branchData.branch_group;

    const workbook = xlsx.read((req as any).file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet);

    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'Empty file' });
      return;
    }

    const valid: any[] = [];
    const duplicates: any[] = [];
    const seenNames = new Set<string>();

    for (const r of rows) {
      const getVal = (key: string) => {
        const matchingKey = Object.keys(r).find(k => k.toLowerCase() === key);
        return matchingKey ? r[matchingKey] : undefined;
      };
      
      const companyName = getVal('company_name')?.toString().trim();
      const hrName = getVal('hr_name')?.toString().trim();
      const email = getVal('email')?.toString().trim();
      const phone_number = getVal('phone_number')?.toString().trim();

      if (!companyName || !hrName) {
        duplicates.push({ row: r, reason: 'Missing required company_name or hr_name' });
        continue;
      }

      const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (seenNames.has(normalizedName)) {
        duplicates.push({ companyName, hrName, reason: 'Duplicate in uploaded file' });
        continue;
      }

      seenNames.add(normalizedName);

      // Check against Supabase
      const { data: existingCompany, error: searchError } = await supabase
        .from('companies')
        .select('id')
        .eq('branch_group_key', branchGroup)
        .eq('status', 'active')
        .ilike('company_name', companyName)
        .limit(1)
        .single();

      if (existingCompany) {
        duplicates.push({ companyName, hrName, reason: 'Exists in Database' });
      } else {
        valid.push({ companyName, hrName, email, phone_number });
      }
    }

    res.status(200).json({ success: true, data: { valid, duplicates, total: rows.length } });
  } catch (error: any) {
    console.error('Preview CSV error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const confirmCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user!.branchId!;
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      res.status(400).json({ success: false, message: 'No companies provided' });
      return;
    }

    const docs = companies.map(c => {
      const normalizedName = c.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return {
        companyName: c.companyName,
        normalizedName,
        hrName: c.hrName || undefined,
        phoneNumber: c.phone_number || undefined,
        hrEmail: c.email || undefined,
        assignedBranch: branchId,
        status: CompanyStatus.APPROVED,
        syncStatus: 'pending',
        review_status: 'approved',
        data_source: 'csv_import',
        reviewed_by: req.user!.userId,
        reviewed_at: new Date(),
        confidenceScore: 100,
        placementScore: 0
      };
    });

    try {
      await Company.insertMany(docs, { ordered: false });
    } catch (insertError: any) {
      if (insertError.code !== 11000) {
        throw insertError; // Ignore duplicate key errors, throw others
      }
    }

    res.status(200).json({ success: true, message: 'Companies saved successfully' });
  } catch (error: any) {
    console.error('Confirm CSV error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
