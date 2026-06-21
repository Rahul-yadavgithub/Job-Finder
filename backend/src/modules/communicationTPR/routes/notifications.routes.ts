import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} from '../controllers/notifications.controller';
import { verifyToken } from '../../../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.get('/unread-count', getUnreadCount);

export default router;
