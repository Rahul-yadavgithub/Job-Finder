import { Router } from 'express';
import mongoose from 'mongoose';
import { supabase } from '../config/supabase';
import { scrapeQueue } from '../jobs/queue';
import Company, { CompanyStatus } from '../models/Company';
import ScanHistory from '../models/ScanHistory';
import RawDiscovery from '../models/RawDiscovery';
import Source from '../models/Source';
import Settings from '../models/Settings';

import HrContact from '../models/HrContact';
import TargetCompany from '../models/TargetCompany';
import { googleSheetService } from '../services/google/GoogleSheetProvider';
import fs from 'fs';
import path from 'path';
import { companyImportService } from '../modules/companyImport/companyImport.service';

import { apiKeyController } from '../controllers/apiKeyController';
import { hrValidationController } from '../controllers/hrValidationController';
import { AgentPipeline } from '../services/agents/AgentPipeline';

import { verifyToken } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/auth.types';

const router = Router();

// --- DASHBOARD STATS ---
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run ALL stat queries in parallel — avoids sequential DB round-trips
    const [
      companiesFound,
      newCompaniesToday,
      freshersHiring,
      internships,
      startups,
      highConfidence,
      campusHiring,
      pendingReview,
      approvedCompanies,
      rejectedCompanies,
      activeSourcesCount,
      lastScan
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ createdAt: { $gte: today } }),
      Company.countDocuments({ fresherHiring: true }),
      Company.countDocuments({ internshipAvailable: true }),
      Company.countDocuments({ fundingStage: { $in: ['Seed', 'Series A', 'Series B'] } }),
      Company.countDocuments({ confidenceScore: { $gte: 90 } }),
      Company.countDocuments({ placementPriority: 'HIGH' }),
      Company.countDocuments({ status: CompanyStatus.PENDING_REVIEW }),
      Company.countDocuments({ status: CompanyStatus.APPROVED }),
      Company.countDocuments({ status: CompanyStatus.REJECTED }),
      Source.countDocuments({ isEnabled: true }),
      ScanHistory.findOne().sort({ date: -1 }).select('date').lean()
    ]);

    res.json({
      companiesFound,
      newCompaniesToday,
      freshersHiring,
      internships,
      startups,
      highConfidence,
      campusHiring,
      pendingReview,
      approvedCompanies,
      rejectedCompanies,
      activeSourcesCount,
      lastScanTime: lastScan?.date || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.post('/scan/trigger', verifyToken, async (req: AuthRequest, res) => {
  try {
    const activeSources = await Source.find({ isEnabled: true });
    
    if (activeSources.length === 0) {
      await scrapeQueue.add('wellfound-scan', { platform: 'Wellfound' });
      return res.json({ message: 'Scan triggered for Wellfound (default)' });
    }

    for (const source of activeSources) {
       const history = await ScanHistory.create({
         platform: source.platformName,
         status: 'QUEUED',
         phase: 'Queued for processing',
         branchId: req.user?.branchId || undefined,
         date: new Date(),
       });

       await scrapeQueue.add(`${source.platformName}-scan`, { 
         platform: source.platformName,
         sourceUrl: source.sourceUrl,
         scanHistoryId: history._id
       });
    }

    res.json({ message: 'Scans triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger scans' });
  }
});

router.post('/scan/trigger/:sourceId', verifyToken, async (req: AuthRequest, res) => {
  try {
    const source = await Source.findById(req.params.sourceId);
    if (!source) {
       return res.status(404).json({ error: 'Source not found' });
    }
    
    const history = await ScanHistory.create({
      platform: source.platformName,
      status: 'QUEUED',
      phase: 'Queued for processing',
      branchId: req.user?.branchId || undefined,
      date: new Date(),
    });

    await scrapeQueue.add(`${source.platformName}-scan`, { 
      platform: source.platformName,
      sourceUrl: source.sourceUrl,
      scanHistoryId: history._id
    });

    res.json({ message: 'Scan triggered', scanHistoryId: history._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger scan' });
  }
});

// --- COMPANIES ---
router.get('/companies', verifyToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = { data_source: 'scanned' };
    if (req.user?.branchId) {
      query.assignedBranch = req.user.branchId;
    }
    if (req.query.search) {
      query.companyName = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Run find and count in parallel + use .lean() to skip Mongoose hydration
    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(query)
    ]);

    res.json({
      data: companies,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// POST /api/settings/google-sheet/sync
// Pulls all data from Master DB Google Sheets and safely inserts into Supabase
router.post('/settings/google-sheet/sync', async (req, res) => {
  try {
    const result = await companyImportService.syncMasterSheets();
    res.json({ 
      success: true, 
      stats: {
        newAdded: result.syncedCount,
        updated: result.duplicates,
        errors: result.errors,
        errorDetails: result.errorDetails
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/update-rpc', async (req, res) => {
  try {
    const sqlPath = path.join(__dirname, '../config/supabase-import-feature.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sqlContent });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/companies/check-name?name=...
router.get('/companies/check-name', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const company = await Company.findOne({ normalizedName });

    if (!company) {
      return res.json({ exists: false });
    }

    const hrContact = await HrContact.findOne({ company_id: company._id.toString() });

    return res.json({
      exists: true,
      company: {
        _id: company._id,
        companyName: company.companyName,
        assignedBranch: company.assignedBranch,
        linkedinCompanyUrl: company.linkedinCompanyUrl,
        linkedinRecruiterUrl: company.linkedinRecruiterUrl
      },
      hrContact: hrContact ? {
        name: hrContact.name,
        mobile: hrContact.mobile,
        email: hrContact.email
      } : null
    });
  } catch (error) {
    console.error('Check name error:', error);
    res.status(500).json({ error: 'Failed to check company name' });
  }
});

router.get('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company.toObject());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

// PATCH /api/companies/:id/review
router.patch('/companies/:id/review', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { action } = req.body;
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (action === 'approve') {
      company.status = CompanyStatus.APPROVED;
      company.review_status = 'approved';
      // Automatically assign to the TPR's branch
      company.assignedBranch = req.user?.branchId || undefined;
      // Mark as pending so it can be picked up by the Sync Center
      company.syncStatus = 'pending';
    } else if (action === 'reject') {
      company.status = CompanyStatus.REJECTED;
      company.review_status = 'scanned';
      company.assignedBranch = undefined;
    }

    company.reviewed_by = req.user?.userId || 'Admin';
    company.reviewed_at = new Date();
    await company.save();

    res.json({ success: true, company });
  } catch (error) {
    console.error('Failed to review company:', error);
    res.status(500).json({ error: 'Failed to review company' });
  }
});

// --- HISTORY API ---
function getCurrentCycleStart(overrideDate?: string) {
  if (overrideDate && process.env.NODE_ENV !== 'production') {
    return new Date(overrideDate);
  }
  const now = new Date();
  const month = now.getMonth(); // 0-indexed. June is 5.
  const year = now.getFullYear();
  if (month >= 5) { // June or after
    return new Date(year, 5, 1);
  } else {
    return new Date(year - 1, 5, 1);
  }
}

async function getScanStats(branchId?: string, fromDate?: Date, toDate?: Date) {
  const companyQuery: any = {};
  if (branchId) {
    companyQuery.assignedBranch = branchId;
  }
  if (fromDate || toDate) {
    companyQuery.createdAt = {};
    if (fromDate) companyQuery.createdAt.$gte = fromDate;
    if (toDate) companyQuery.createdAt.$lte = toDate;
  }

  const totalScanned = await Company.countDocuments(companyQuery);
  const scannedCompanies = await Company.find(companyQuery).lean();
  
  let internship = 0;
  let fullTime = 0;
  let startup = 0;

  scannedCompanies.forEach(c => {
    if (c.internshipAvailable) internship++;
    if (c.fresherHiring) fullTime++;
    if (['Seed', 'Series A', 'Series B'].includes(c.fundingStage || '')) startup++;
  });

  const reviewQuery: any = { status: { $in: [CompanyStatus.APPROVED, CompanyStatus.REJECTED] } };
  if (branchId) reviewQuery.assignedBranch = branchId;
  if (fromDate || toDate) {
    reviewQuery.reviewed_at = {};
    if (fromDate) reviewQuery.reviewed_at.$gte = fromDate;
    if (toDate) reviewQuery.reviewed_at.$lte = toDate;
  }
  const totalReviewed = await Company.countDocuments(reviewQuery);

  const approveQuery: any = { ...reviewQuery, status: CompanyStatus.APPROVED };
  const totalApproved = await Company.countDocuments(approveQuery);

  return {
    totalScanned,
    totalReviewed,
    totalApproved,
    breakdown: { internship, fullTime, startup }
  };
}

router.get('/history/scan-stats', verifyToken, async (req: AuthRequest, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const stats = await getScanStats(req.user?.branchId || undefined, from, to);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan stats' });
  }
});

router.get('/history/current-scan-stats', verifyToken, async (req: AuthRequest, res) => {
  try {
    const fromDate = getCurrentCycleStart(req.query.override_cycle_start as string);
    const stats = await getScanStats(req.user?.branchId || undefined, fromDate);
    res.json({ current_cycle_start: fromDate, ...stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current scan stats' });
  }
});

// --- SOURCES ---
router.get('/sources', async (req, res) => {
  try {
    const sources = await Source.find();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

router.post('/sources', async (req, res) => {
  try {
    const source = new Source(req.body);
    await source.save();
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create source' });
  }
});

router.put('/sources/:id/toggle', async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });
    
    source.isEnabled = !source.isEnabled;
    await source.save();
    res.json(source);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle source' });
  }
});

router.delete('/sources/:id', async (req, res) => {
  try {
    const source = await Source.findByIdAndDelete(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });
    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete source' });
  }
});

// Helper for dynamic academic year calculation
function getAcademicYears(overrideYear?: string) {
  let current: string;
  if (overrideYear && process.env.NODE_ENV !== 'production') {
    current = overrideYear;
  } else {
    const now = new Date();
    const year = now.getFullYear();
    if (now.getMonth() < 6) { // Jan - June
      current = `${year - 1}-${year}`;
    } else { // July - Dec
      current = `${year}-${year + 1}`;
    }
  }
  const [start, end] = current.split('-');
  const last = `${parseInt(start) - 1}-${parseInt(end) - 1}`;
  return { current, last };
}

function aggregateCompanyGroups(companies: any[]) {
  const total = companies.length;
  const drive_types: Record<string, number> = {};
  const roles: Record<string, number> = {};

  companies.forEach(c => {
    // Standardize empty/null cases
    let dt = (c.drive_type || 'Unknown').trim();
    if (dt.toLowerCase() === 'pool') dt = 'Pool';
    if (dt.toLowerCase() === 'in-campus' || dt.toLowerCase() === 'incampus') dt = 'In-Campus';
    
    drive_types[dt] = (drive_types[dt] || 0) + 1;

    let r = (c.role || 'General Application').trim();
    roles[r] = (roles[r] || 0) + 1;
  });

  return { total, drive_types, roles, companies };
}

router.post('/target-companies/import', async (req, res) => {
  try {
    const companies = req.body;
    if (!Array.isArray(companies)) {
      return res.status(400).json({ error: 'Payload must be an array' });
    }
    
    // Clear out target companies matching the academic years provided in the payload
    const years = new Set(companies.map(c => c.academic_year).filter(Boolean));
    for (const year of years) {
      await TargetCompany.deleteMany({ academic_year: year });
    }

    await TargetCompany.insertMany(companies);
    res.json({ message: 'Target companies imported successfully', count: companies.length });
  } catch (error) {
    console.error('Import target companies error:', error);
    res.status(500).json({ error: 'Failed to import target companies' });
  }
});

router.get('/dashboard/target-companies', async (req, res) => {
  try {
    const { current } = getAcademicYears(req.query.override_year as string);
    const companies = await TargetCompany.find({ academic_year: current }).lean();
    
    // Normalize data shape to match company response
    const normalizedCompanies = companies.map(c => ({
      ...c,
      companyName: c.company_name
    }));

    res.json({ academic_year: current, ...aggregateCompanyGroups(normalizedCompanies) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch target companies' });
  }
});

router.get('/dashboard/confirmed-last-year', async (req, res) => {
  try {
    const { last } = getAcademicYears(req.query.override_year as string);
    const companies = await Company.find({ 
      confirmation_status: 'confirmed',
      academic_year: last 
    }).lean();
    res.json({ academic_year: last, ...aggregateCompanyGroups(companies) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch confirmed companies for last year' });
  }
});

router.get('/dashboard/summary', async (req, res) => {
  try {
    const { current, last } = getAcademicYears(req.query.override_year as string);

    // Query confirmed companies. If academic_year is null/empty/missing, fallback to current year.
    const [pendingReview, thisYearCompanies, lastYearCompanies] = await Promise.all([
      Company.countDocuments({ data_source: 'scanned', review_status: 'scanned' }),
      Company.find({
        confirmation_status: 'confirmed',
        $or: [
          { academic_year: current },
          { academic_year: null },
          { academic_year: '' },
          { academic_year: { $exists: false } }
        ]
      }).lean(),
      Company.find({ confirmation_status: 'confirmed', academic_year: last }).lean(),
    ]);

    const buildGroup = (companies: any[]) => {
      const by_drive_type: Record<string, number> = {};
      const by_role: Record<string, number> = {};
      companies.forEach(c => {
        let dt = (c.drive_type || '').trim().toLowerCase();
        if (dt === 'pool') {
          dt = 'Pool';
        } else {
          // If no status or not Pool, consider in the on-campus calculation
          dt = 'In-Campus';
        }
        by_drive_type[dt] = (by_drive_type[dt] || 0) + 1;

        const r = (c.role || 'General Application').trim();
        by_role[r] = (by_role[r] || 0) + 1;
      });
      return {
        total: companies.length,
        by_drive_type,
        by_role: Object.entries(by_role)
          .sort((a, b) => b[1] - a[1])
          .map(([role, count]) => ({ role, count }))
      };
    };

    res.json({
      pending_review_count: pendingReview,
      confirmed_this_year: { academic_year: current, ...buildGroup(thisYearCompanies) },
      confirmed_last_year: { academic_year: last, ...buildGroup(lastYearCompanies) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

router.get('/dashboard/confirmed-companies', async (req, res) => {
  try {
    const year = req.query.year as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const { current } = getAcademicYears();
    const isCurrentYear = year === current;

    let companies: any[];
    let total: number;

    if (isCurrentYear) {
      // Current year confirmed companies (includes those with null/empty/missing academic_year)
      const query: any = {
        confirmation_status: 'confirmed',
        $or: [
          { academic_year: year },
          { academic_year: null },
          { academic_year: '' },
          { academic_year: { $exists: false } }
        ]
      };
      [companies, total] = await Promise.all([
        Company.find(query)
          .sort({ expected_year: -1, expected_month: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Company.countDocuments(query)
      ]);
    } else {
      const query: any = { confirmation_status: 'confirmed', academic_year: year };
      [companies, total] = await Promise.all([
        Company.find(query)
          .sort({ expected_year: -1, expected_month: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Company.countDocuments(query)
      ]);
    }

    // Join HR contacts
    const companyIds = companies.map(c => c._id).filter(Boolean);
    const hrContacts = companyIds.length > 0
      ? await HrContact.find({ company_id: { $in: companyIds } }).lean()
      : [];
    const hrMap = new Map(hrContacts.map(h => [h.company_id.toString(), h]));

    const enriched = companies.map(c => ({
      _id: c._id,
      company_name: c.companyName || c.company_name || 'Unknown',
      drive_type: c.drive_type || null,
      role: c.role || null,
      package: c.package || null,
      expected_month: c.expected_month || null,
      expected_year: c.expected_year || null,
      assignedBranch: c.assignedBranch || null,
      hr: hrMap.get(c._id?.toString()) ? {
        name: hrMap.get(c._id.toString())?.name,
        email: hrMap.get(c._id.toString())?.email,
        mobile: hrMap.get(c._id.toString())?.mobile,
      } : null
    }));

    res.json({ companies: enriched, total, page, per_page: limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch confirmed companies list' });
  }
});

// --- COMPANIES ---
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Not configured in .env';
    
    res.json({ ...settings.toJSON(), serviceAccountEmail });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      settings.currentAcademicYearSheetId = req.body.currentAcademicYearSheetId;
      settings.pastAcademicYearSheetId = req.body.pastAcademicYearSheetId;
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/settings/google-sheet/service-account', (req, res) => {
  res.json({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Not configured in .env' });
});

router.post('/settings/google-sheet/test', async (req, res) => {
  const { sheetId } = req.body;
  if (!sheetId) {
    return res.status(400).json({ error: 'sheetId is required' });
  }

  const result = await googleSheetService.testConnection(sheetId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({ success: true, message: 'Connection successful' });
});

// --- SCAN HISTORY ---
router.get('/history', verifyToken, async (req: AuthRequest, res) => {
  try {
    const query: any = {};
    if (req.user?.branchId) {
      query.branchId = req.user.branchId;
    }
    const history = await ScanHistory.find(query).sort({ date: -1 }).limit(50).lean();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

router.get('/history/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const query: any = { _id: req.params.id };
    if (req.user?.branchId) {
      query.branchId = req.user.branchId;
    }
    const history = await ScanHistory.findOne(query).lean();
    if (!history) return res.status(404).json({ error: 'History not found' });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history record' });
  }
});

router.delete('/history/:id', async (req, res) => {
  try {
    const history = await ScanHistory.findByIdAndDelete(req.params.id);
    if (!history) return res.status(404).json({ error: 'History not found' });
    res.json({ message: 'History record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history record' });
  }
});

router.get('/history/:id/raw', async (req, res) => {
  try {
    const raw = await RawDiscovery.find({ scanHistoryId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(raw);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch raw discoveries' });
  }
});

router.post('/history/raw/:id/validate', async (req, res) => {
  try {
    const rawDoc = await RawDiscovery.findById(req.params.id);
    if (!rawDoc) return res.status(404).json({ error: 'Raw discovery not found' });

    if (rawDoc.status === 'VALIDATED' || rawDoc.status === 'DUPLICATE') {
      return res.status(400).json({ error: 'Already processed' });
    }

    const pipeline = new AgentPipeline();
    const result = await pipeline.processDiscoveredCompany({
      companyName: rawDoc.companyName,
      website: rawDoc.website || '',
      description: rawDoc.description || '',
      source: rawDoc.source,
      sourceUrl: rawDoc.sourceUrl,
      careersUrl: rawDoc.careersUrl || '',
      salaryText: rawDoc.salaryText || ''
    }, rawDoc.scanHistoryId.toString(), rawDoc._id as unknown as string, true);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to manually validate raw company' });
  }
});

// --- API KEY MANAGEMENT ROUTES ---
router.get('/branches/:branch_id/api-keys', apiKeyController.getApiKeys);
router.post('/branches/:branch_id/api-keys/validate', apiKeyController.validateAndSaveKey);
router.delete('/branches/:branch_id/api-keys/:key_id', apiKeyController.disableApiKey);
router.post('/branches/:branch_id/api-keys/:key_id/replace', apiKeyController.replaceApiKey);
router.get('/branches/:branch_id/notifications', apiKeyController.getNotifications);
router.post('/branches/:branch_id/notifications/:id/dismiss', apiKeyController.dismissNotification);

// --- BASE TPR NOTIFICATIONS ---
router.get('/notifications', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.userId)
      .eq('is_read', false);
      
    if (countError) throw countError;
    
    res.json({ success: true, data: { notifications: data, unreadCount: unreadCount || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/notifications/:id/read', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', req.user!.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.patch('/notifications/read-all', verifyToken, async (req: AuthRequest, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user!.userId).eq('is_read', false);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/notifications/unread-count', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.userId)
      .eq('is_read', false);
    if (error) throw error;
    res.json({ success: true, count: count || 0 });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// --- HR VALIDATION ROUTES ---
router.post('/companies/:company_id/find-hr', hrValidationController.findHrContact);
router.get('/companies/:company_id/hr-contacts', hrValidationController.getHrContact);
router.post('/companies/:company_id/hr-contacts/commit', hrValidationController.commitHrContact);
router.post('/companies/:company_id/hr-contacts/approve-pending', hrValidationController.approvePendingContact);
router.post('/companies/:company_id/hr-contacts/discard-pending', hrValidationController.discardPendingContact);
router.post('/companies/:company_id/acknowledge-hr-update', hrValidationController.acknowledgeHrUpdate);

// Startup migration for legacy scanned companies
(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }
    
    // 1. Set data_source = 'scanned' where data_source is missing
    const res1 = await Company.updateMany(
      { data_source: { $exists: false } } as any,
      { $set: { data_source: 'scanned' } }
    );
    if (res1.modifiedCount > 0) {
      console.log(`[Migration] Set data_source='scanned' for ${res1.modifiedCount} legacy companies.`);
    }

    // 2. Set review_status = 'scanned' where missing and status is not APPROVED
    const res2 = await Company.updateMany(
      { review_status: { $exists: false }, status: { $ne: 'APPROVED' } } as any,
      { $set: { review_status: 'scanned' } }
    );
    if (res2.modifiedCount > 0) {
      console.log(`[Migration] Set review_status='scanned' for ${res2.modifiedCount} legacy pending companies.`);
    }

    // 3. Set review_status = 'approved' where missing and status is APPROVED
    const res3 = await Company.updateMany(
      { review_status: { $exists: false }, status: 'APPROVED' } as any,
      { $set: { review_status: 'approved' } }
    );
    if (res3.modifiedCount > 0) {
      console.log(`[Migration] Set review_status='approved' for ${res3.modifiedCount} legacy approved companies.`);
    }
  } catch (err) {
    console.error('[Migration] Failed to run legacy company migration:', err);
  }
})();

export default router;
