import { Router } from 'express';
import { 
  getAllRequests, 
  getRequestStats, 
  approveBranchTpr, 
  rejectBranchTpr 
} from '../controllers/adminRequests.controller';
import { 
  approveWorker, 
  rejectWorker 
} from '../controllers/workerManagement.controller';
import { verifyAdminToken, requireSuperAdmin } from '../middleware/adminAuth.middleware';

const router = Router();

// Approvals are strictly for Head TPO
router.use(verifyAdminToken);
router.use(requireSuperAdmin);

router.get('/requests', getAllRequests);
router.get('/requests/stats', getRequestStats);

router.post('/requests/workers/:requestId/approve', approveWorker);
router.post('/requests/workers/:requestId/reject', rejectWorker);

router.post('/requests/tprs/:userId/approve', approveBranchTpr);
router.post('/requests/tprs/:userId/reject', rejectBranchTpr);

export default router;
