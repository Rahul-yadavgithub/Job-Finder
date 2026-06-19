import { Router } from 'express';
import { verifyCommunicationTPRToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyCommunicationTPRToken);

// Placeholder for dashboard overview stats
router.get('/overview', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Welcome to Communication TPR Dashboard'
    }
  });
});

export default router;
