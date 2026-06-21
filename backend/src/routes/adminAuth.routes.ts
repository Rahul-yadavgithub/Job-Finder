import { Router } from 'express';
import { adminLogin, requestAccess, adminLogout, adminMe, adminForgotPassword, adminResetPassword, updateProfile } from '../controllers/adminAuth.controller';
import { verifyAdminToken } from '../middleware/adminAuth.middleware';

const router = Router();

router.post('/login', adminLogin);
router.post('/request-access', requestAccess);
router.post('/logout', verifyAdminToken, adminLogout);
router.get('/me', verifyAdminToken, adminMe);
router.patch('/profile', verifyAdminToken, updateProfile);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);

export default router;
