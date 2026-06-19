import { Router } from 'express';
import {
  getPendingRequests,
  approveWorker,
  rejectWorker,
  suspendWorker,
  reinstateWorker,
  getAllWorkers,
  getAuditLog,
  designateSuccessor,
  getCompaniesCount,
  getAuditTodayCount
} from '../controllers/workerManagement.controller';
import { verifyAdminToken, requireSuperAdmin, requireAdminRole } from '../middleware/adminAuth.middleware';

const router = Router();

// Base middleware for all worker management routes
router.use(verifyAdminToken);

router.get('/workers', requireAdminRole('head', 'caller'), getAllWorkers);
router.get('/workers/pending-requests', requireSuperAdmin, getPendingRequests);
router.post('/workers/:requestId/approve', requireSuperAdmin, approveWorker);
router.post('/workers/:requestId/reject', requireSuperAdmin, rejectWorker);
router.post('/workers/:userId/suspend', requireSuperAdmin, suspendWorker);
router.post('/workers/:userId/reinstate', requireSuperAdmin, reinstateWorker);
router.post('/workers/designate-successor', requireSuperAdmin, designateSuccessor);

router.get('/audit-log', requireSuperAdmin, getAuditLog);

router.get('/stats/companies', requireAdminRole('head', 'caller'), getCompaniesCount);
router.get('/stats/audit-today', requireSuperAdmin, getAuditTodayCount);

export default router;
