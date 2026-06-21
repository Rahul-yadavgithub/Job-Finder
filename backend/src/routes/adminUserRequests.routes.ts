import { Router } from 'express';
import { 
  getAllUserRequests, 
  getUserRequestStats, 
  approveBranchTpr, 
  rejectBranchTpr 
} from '../controllers/adminUserRequests.controller';
import { 
  approveWorker, 
  rejectWorker 
} from '../controllers/workerManagement.controller';
import { verifyAdminToken, requireSuperAdmin } from '../middleware/adminAuth.middleware';

const router = Router();

// Approvals are strictly for Head TPO
router.use(verifyAdminToken);
router.use(requireSuperAdmin);

router.get('/user-requests', getAllUserRequests);
router.get('/user-requests/stats', getUserRequestStats);

router.post('/user-requests/workers/:requestId/approve', approveWorker);
router.post('/user-requests/workers/:requestId/reject', rejectWorker);

router.post('/user-requests/tprs/:userId/approve', approveBranchTpr);
router.post('/user-requests/tprs/:userId/reject', rejectBranchTpr);

export default router;
