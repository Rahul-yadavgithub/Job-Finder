import { Router } from 'express';
import { adminLogin, requestAccess, adminLogout, adminMe, adminForgotPassword, adminResetPassword, updateProfile } from '../controllers/adminAuth.controller';
import { verifyAdminToken } from '../middleware/adminAuth.middleware';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { adminLoginSchema, requestAccessSchema } from '../schemas/adminAuth.schema';
import { forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login', loginLimiter, validate(adminLoginSchema), adminLogin);
router.post('/request-access', registerLimiter, validate(requestAccessSchema), requestAccess);
router.post('/logout', verifyAdminToken, adminLogout);
router.get('/me', verifyAdminToken, adminMe);
router.patch('/profile', verifyAdminToken, updateProfile);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), adminForgotPassword);
router.post('/reset-password', forgotPasswordLimiter, validate(resetPasswordSchema), adminResetPassword);

export default router;
