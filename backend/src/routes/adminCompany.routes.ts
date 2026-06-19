import { Router } from 'express';
import { 
  getCompanyStats, 
  getCompanies, 
  getCompanyDetail 
} from '../controllers/adminCompany.controller';
import { verifyAdminToken, requireAdminRole } from '../middleware/adminAuth.middleware';

const router = Router();

// Ensure user is an admin and has either 'head' or 'caller' or 'coordinator' role
// For the companies section, 'head' and 'caller' and 'coordinator' can all view it.
router.use(verifyAdminToken);
router.use(requireAdminRole('head', 'caller', 'coordinator'));

router.get('/companies/stats', getCompanyStats);
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyDetail);

export default router;
