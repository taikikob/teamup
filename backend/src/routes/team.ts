import { Router } from 'express';
import { getTeams, postCreate } from '../handlers/team';
import { isAuth } from '../lib/authMiddleware';

const router = Router();

router.get('/get', isAuth, getTeams);
router.post('/create', isAuth, postCreate);

export default router;