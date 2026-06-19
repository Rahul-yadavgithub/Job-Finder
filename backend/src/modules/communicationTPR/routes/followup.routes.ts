import { Router } from 'express';
import { FollowUpController } from '../controllers/followup.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const followUpController = new FollowUpController();

router.use(verifyCommunicationTPRToken);

router.get('/my-followups', followUpController.getMyFollowUps);
router.get('/company/:companyId', followUpController.getCompanyFollowUps);
router.post('/company/:companyId', followUpController.createFollowUp);
router.patch('/:id/status', followUpController.updateFollowUpStatus);

export default router;
