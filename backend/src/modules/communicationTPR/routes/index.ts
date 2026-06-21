import { Router } from 'express';
import authRoutes from './auth.routes';
import dashboardRoutes from './dashboard.routes';
import companyRoutes from './company.routes';
import activityRoutes from './activity.routes';
import requestRoutes from './request.routes';
import followUpRoutes from './followup.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/companies', companyRoutes);
router.use('/activities', activityRoutes);
router.use('/requests', requestRoutes);
router.use('/follow-ups', followUpRoutes);
router.use('/settings', settingsRoutes);

export default router;
