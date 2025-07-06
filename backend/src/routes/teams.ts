import { Router } from 'express';
import { getTeams, getTeamInfo, postCreate } from '../handlers/teams';
import { isAuth } from '../lib/authMiddleware';

const router = Router();

router.get('/', isAuth, getTeams);
router.get('/:team_id', isAuth, getTeamInfo);
router.post('/create', isAuth, postCreate);

export default router;