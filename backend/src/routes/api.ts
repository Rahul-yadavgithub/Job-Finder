import { Router } from 'express';
import { scrapeQueue } from '../jobs/queue';
import Company, { CompanyStatus } from '../models/Company';
import ScanHistory from '../models/ScanHistory';
import Source from '../models/Source';
import Settings from '../models/Settings';
import { googleSheetService } from '../services/google/GoogleSheetProvider';

const router = Router();

// --- DASHBOARD STATS ---
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const companiesFound = await Company.countDocuments();
    const newCompaniesToday = await Company.countDocuments({ createdAt: { $gte: today } });
    
    const freshersHiring = await Company.countDocuments({ fresherHiring: true });
    const internships = await Company.countDocuments({ internshipAvailable: true });
    const startups = await Company.countDocuments({ fundingStage: { $in: ['Seed', 'Series A', 'Series B'] } }); // Approximated
    const highConfidence = await Company.countDocuments({ confidenceScore: { $gte: 90 } });
    const campusHiring = await Company.countDocuments({ placementPriority: 'HIGH' });
    const pendingReview = await Company.countDocuments({ status: CompanyStatus.PENDING_REVIEW });
    const approvedCompanies = await Company.countDocuments({ status: CompanyStatus.APPROVED });
    const rejectedCompanies = await Company.countDocuments({ status: CompanyStatus.REJECTED });

    const activeSourcesCount = await Source.countDocuments({ isEnabled: true });
    const lastScan = await ScanHistory.findOne().sort({ date: -1 });

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

// --- SCAN TRIGGER ---
router.post('/scan/trigger', async (req, res) => {
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

router.post('/scan/trigger/:sourceId', async (req, res) => {
  try {
    const source = await Source.findById(req.params.sourceId);
    if (!source) {
       return res.status(404).json({ error: 'Source not found' });
    }
    
    const history = await ScanHistory.create({
      platform: source.platformName,
      status: 'QUEUED',
      phase: 'Queued for processing',
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
router.get('/companies', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.search) {
      query.companyName = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Company.countDocuments(query);

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

router.put('/companies/:id/approve', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status: CompanyStatus.APPROVED },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve company' });
  }
});

router.put('/companies/:id/reject', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { status: CompanyStatus.REJECTED },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject company' });
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

// --- SETTINGS ---
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
      settings.googleSheetId = req.body.googleSheetId;
      settings.googleSheetName = req.body.googleSheetName;
      settings.targetWorksheet = req.body.targetWorksheet;
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
  const { sheetId, worksheetName } = req.body;
  if (!sheetId || !worksheetName) {
    return res.status(400).json({ error: 'sheetId and worksheetName are required' });
  }

  const result = await googleSheetService.testConnection(sheetId, worksheetName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({ success: true, message: 'Connection successful' });
});

router.post('/companies/sync-sheet', async (req, res) => {
  try {
    const companies = await Company.find({ status: CompanyStatus.APPROVED });
    if (companies.length === 0) {
      return res.status(400).json({ error: 'No approved companies to sync' });
    }

    // Convert new company models to match old structure expected by GoogleSheetProvider
    // Or we should update GoogleSheetProvider as well. 
    // Let's assume we will update GoogleSheetProvider next.
    const syncedCount = await googleSheetService.syncAllCompanies(companies);
    
    let settings = await Settings.findOne();
    if (settings) {
      settings.lastSyncDate = new Date();
      settings.totalSynced = syncedCount;
      await settings.save();
    }

    res.json({ success: true, syncedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync companies' });
  }
});

// --- SCAN HISTORY ---
router.get('/history', async (req, res) => {
  try {
    const history = await ScanHistory.find().sort({ date: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

router.get('/history/:id', async (req, res) => {
  try {
    const history = await ScanHistory.findById(req.params.id);
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

export default router;
