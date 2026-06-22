import { Router } from 'express';
import multer from 'multer';
import {
  getDashboard,
  getCompanies,
  getTodayCompanies,
  updateStatus,
  importCSV,
  syncSheet,
  pushSync,
  getPendingSyncCompanies,
  getSheetUrl,
  getSyncHistory,
  checkCompanyName,
  addManualCompany,
  removePendingCompany,
  getCompanyHistory,
  previewCSV,
  confirmCSV,
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  markAllNotificationsRead
} from '../controllers/tpr.controller';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes here are protected and branch-scoped
router.use(verifyToken, requireRole('branch_tpr'), requireBranch);

router.get('/dashboard', getDashboard);
router.get('/companies', getCompanies);
router.get('/companies/today', getTodayCompanies);
router.get('/companies/:id/history', getCompanyHistory);
router.patch('/companies/:id/status', updateStatus);
router.post('/sync', pushSync);
router.get('/sync/pending', getPendingSyncCompanies);
router.delete('/sync/pending/:id', removePendingCompany);
router.post('/sync/inbound', syncSheet);
router.post('/manual-company', addManualCompany);
router.get('/sheet-url', getSheetUrl);
router.get('/sync-history', getSyncHistory);
router.get('/check-name', checkCompanyName);
router.post('/import/preview', upload.single('file'), previewCSV);
router.post('/import/confirm', confirmCSV);

// Notification endpoints
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/read', markNotificationsRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

export default router;
