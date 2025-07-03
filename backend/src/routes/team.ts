import { Router } from 'express';
import { postCreate } from '../handlers/team';
import { isAuth } from '../lib/authMiddleware';

const router = Router();

router.post('/create', isAuth, postCreate);

export default router;