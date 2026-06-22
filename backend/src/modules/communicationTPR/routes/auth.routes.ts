import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';
import { loginLimiter } from '../../../middleware/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', loginLimiter, authController.login);
router.post('/logout', verifyCommunicationTPRToken, authController.logout);
router.get('/me', verifyCommunicationTPRToken, authController.me);
router.patch('/profile', verifyCommunicationTPRToken, authController.updateProfile);
router.get('/branches', authController.getBranches);

export default router;
