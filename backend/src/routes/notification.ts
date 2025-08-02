import { Router } from 'express';
import { getNotifications, markAsRead, markAsUnread } from '../handlers/notification';
import { isAuth } from '../lib/authMiddleware';

const router = Router();

router.get('/', isAuth, getNotifications);
router.patch('/:id/read', isAuth, markAsRead);
router.patch('/:id/unread', isAuth, markAsUnread);

export default router;