import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const settingsController = new SettingsController();

router.use(verifyCommunicationTPRToken);

router.get('/templates', settingsController.getTemplates);
router.post('/templates', settingsController.uploadTemplate);

router.get('/followup-rules', settingsController.getFollowupRules);
router.patch('/followup-rules/:followupNumber', settingsController.updateFollowupRule);

export default router;
