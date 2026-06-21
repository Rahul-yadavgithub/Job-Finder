import { Router } from 'express';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

router.use(verifyCommunicationTPRToken);

router.get('/overview', dashboardController.getOverview);

export default router;
