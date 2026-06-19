import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { AuthRequest } from '../types/auth.types';

const router = Router();

router.get('/users/pending', verifyToken, requireRole('caller', 'head'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, roll_number, status, created_at, role, branches(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/users/:userId/approve', verifyToken, requireRole('caller', 'head'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .update({
        status: 'approved',
        approved_by: req.user!.userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, name, email, roll_number, status, created_at, role, branches(name)')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/users/:userId/suspend', verifyToken, requireRole('head'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', userId)
      .select('id, name, email, roll_number, status, created_at, role, branches(name)')
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
