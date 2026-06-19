import { Router } from 'express';
import {
  initiateTransfer,
  completeTransfer,
  getSuccessionInfo,
  updateSuccessionNote,
  checkRecoveryToken
} from '../controllers/leadershipTransfer.controller';
import { verifyAdminToken, requireSuperAdmin } from '../middleware/adminAuth.middleware';

const router = Router();

router.post('/transfer/initiate', verifyAdminToken, requireSuperAdmin, initiateTransfer);
router.get('/transfer/check', checkRecoveryToken); // No auth middleware
router.post('/transfer/complete', completeTransfer); // No auth middleware
router.get('/transfer/succession-info', verifyAdminToken, requireSuperAdmin, getSuccessionInfo);
router.patch('/transfer/succession-note', verifyAdminToken, requireSuperAdmin, updateSuccessionNote);

export default router;
