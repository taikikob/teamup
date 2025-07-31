import { Router } from 'express';
import { getTeams, getTeamInfo, getTeamFlow, getNodeTasks, postCreate, postJoin, newAC, postFlow, editDescription, deleteAC, updateNodeLabel, postCreateTask, updateTaskOrder, deleteTask, deletePlayer } from '../handlers/teams';
import { isAuth, isCoach } from '../lib/authMiddleware';

const router = Router();

// all routes using isCoach should have team_id in the url
router.get('/', isAuth, getTeams);
router.post('/create', isAuth, postCreate);
router.post('/join', isAuth, postJoin);
router.get('/:team_id', isAuth, getTeamInfo);
router.get('/:team_id/flow', isAuth, getTeamFlow);
router.post('/:team_id/newAccessCode', isAuth, isCoach, newAC);
router.get('/:team_id/:node_id/tasks', isAuth, getNodeTasks); // Assuming this is the correct route for fetching levels
router.post('/:team_id/flow', isAuth, isCoach, postFlow);
router.post('/:team_id/node-label', isAuth, isCoach, updateNodeLabel);
router.post('/:team_id/:node_id/tasks', isAuth, isCoach, postCreateTask);
router.put('/:team_id/:node_id/tasks/order', isAuth, isCoach, updateTaskOrder);
router.patch('/:team_id/editDescription', isAuth, isCoach, editDescription);
router.delete('/:team_id/player/:player_id', isAuth, isCoach, deletePlayer);
router.delete('/:team_id/delAccessCode', isAuth, isCoach, deleteAC);
router.delete('/:team_id/:node_id/tasks/:task_id', isAuth, isCoach, deleteTask);

export default router;