import { Router } from 'express';
import { adminLogin, requestAccess, adminLogout, adminMe } from '../controllers/adminAuth.controller';
import { verifyAdminToken } from '../middleware/adminAuth.middleware';

const router = Router();

router.post('/login', adminLogin);
router.post('/request-access', requestAccess);
router.post('/logout', verifyAdminToken, adminLogout);
router.get('/me', verifyAdminToken, adminMe);

export default router;
