import { Router } from 'express';
import { register, login, logout, me, getBranches, checkRoleByEmail, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/branches', getBranches);
router.get('/check-role/:email', checkRoleByEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
