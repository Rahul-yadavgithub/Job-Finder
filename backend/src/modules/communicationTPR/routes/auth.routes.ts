import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/logout', verifyCommunicationTPRToken, authController.logout);
router.get('/me', verifyCommunicationTPRToken, authController.me);

export default router;
