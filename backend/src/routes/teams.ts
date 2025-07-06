import { Router } from 'express';
import { getTeams, getTeamInfo, postCreate, editDescription } from '../handlers/teams';
import { isAuth, isCoach } from '../lib/authMiddleware';

const router = Router();

// all routes using isCoach should have team_id in the url
router.get('/', isAuth, getTeams);
router.get('/:team_id', isAuth, getTeamInfo);
router.post('/create', isAuth, postCreate);
router.patch('/:team_id/editDescription', isAuth, isCoach, editDescription);

export default router;