import { Router } from 'express';
import { register, login, logout, me, getBranches, checkRoleByEmail, forgotPassword, resetPassword, updateProfile } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema';

const router = Router();

router.get('/branches', getBranches);
router.get('/check-role/:email', checkRoleByEmail);
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.patch('/profile', verifyToken, updateProfile);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
