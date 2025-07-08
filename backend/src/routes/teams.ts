import { Router } from 'express';
import { getTeams, getTeamInfo, postCreate, postJoin, newAC, editDescription, deleteAC } from '../handlers/teams';
import { isAuth, isCoach } from '../lib/authMiddleware';

const router = Router();

// all routes using isCoach should have team_id in the url
router.get('/', isAuth, getTeams);
router.get('/:team_id', isAuth, getTeamInfo);
router.post('/create', isAuth, postCreate);
router.post('/join', isAuth, postJoin);
router.post('/:team_id/newAccessCode', isAuth, isCoach, newAC);
router.patch('/:team_id/editDescription', isAuth, isCoach, editDescription);
router.delete('/:team_id/delAccessCode', isAuth, isCoach, deleteAC);

export default router;