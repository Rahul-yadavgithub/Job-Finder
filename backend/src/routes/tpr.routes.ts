import { Router } from 'express';
import multer from 'multer';
import {
  getDashboard,
  getCompanies,
  getTodayCompanies,
  updateStatus,
  importCSV,
  syncSheet,
  getSheetUrl,
  getSyncHistory
} from '../controllers/tpr.controller';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes here are protected and branch-scoped
router.use(verifyToken, requireRole('branch_tpr'), requireBranch);

router.get('/dashboard', getDashboard);
router.get('/companies', getCompanies);
router.get('/companies/today', getTodayCompanies);
router.patch('/companies/:id/status', updateStatus);
router.post('/import', upload.single('file'), importCSV);
router.post('/sync', syncSheet);
router.post('/sync/inbound', syncSheet); // If inbound is different, adjust. Using syncSheet for now.
router.get('/sheet-url', getSheetUrl);
router.get('/sync-history', getSyncHistory);

export default router;
