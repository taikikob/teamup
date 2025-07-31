import { Router } from 'express';
import { getNotifications } from '../handlers/notification';
import { isAuth, isCoach } from '../lib/authMiddleware';

const router = Router();

router.get('/', isAuth, getNotifications);

export default router;