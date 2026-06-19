import { Router } from 'express';
import {
  getMidDashboard,
  getPendingCompanies,
  getAllMidCompanies,
  getTodayContacts,
  getCompanyDetail,
  updateMidStatus
} from '../controllers/caller.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken, requireRole('caller', 'head'));

router.get('/dashboard', getMidDashboard);
router.get('/companies/pending', getPendingCompanies);
router.get('/companies', getAllMidCompanies);
router.get('/companies/today', getTodayContacts);
router.get('/companies/:id', getCompanyDetail);
router.patch('/companies/:id/status', updateMidStatus);

export default router;
