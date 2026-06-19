import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} from '../controllers/notifications.controller';
import { verifyAdminToken } from '../middleware/adminAuth.middleware';

const router = Router();

router.use(verifyAdminToken);

router.get('/notifications', getNotifications);
router.patch('/notifications/read', markAsRead);
router.patch('/notifications/read-all', markAllAsRead);
router.get('/notifications/unread-count', getUnreadCount);

export default router;
