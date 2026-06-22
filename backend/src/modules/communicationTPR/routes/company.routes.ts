import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const companyController = new CompanyController();

router.use(verifyCommunicationTPRToken);

router.get('/branches', companyController.getBranches);
router.get('/dashboard/stats', companyController.getDashboardStats);
router.get('/', companyController.getInterestedCompanies);
router.get('/:id', companyController.getCompanyDetail);
router.patch('/:id/stage', companyController.updateStage);
router.post('/:id/transfer', companyController.transferToHead);
router.get('/:id/timeline', companyController.getCompanyTimeline);

export default router;
