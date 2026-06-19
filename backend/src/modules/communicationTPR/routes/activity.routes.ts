import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const activityController = new ActivityController();

router.use(verifyCommunicationTPRToken);

router.get('/company/:companyId', activityController.getCompanyActivities);
router.post('/company/:companyId', activityController.createActivity);

export default router;
