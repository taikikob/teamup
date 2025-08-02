import { Router } from 'express';
import { getTeams, getTeamInfo, getTeamFlow, getNodeTasks, postCreate, postJoin, newAC, postFlow, editDescription, deleteAC, updateNodeLabel, postCreateTask, updateTaskOrder, deleteTask, deletePlayer } from '../handlers/teams';
import { isAuth, isCoach, checkTeamMembership } from '../lib/authMiddleware';

const router = Router();

// all routes using isCoach should have team_id in the url
router.get('/', isAuth, getTeams);
router.post('/create', isAuth, postCreate);
router.post('/join', isAuth, postJoin);
router.get('/:team_id', isAuth, checkTeamMembership, getTeamInfo);
router.get('/:team_id/flow', isAuth, checkTeamMembership, getTeamFlow);
router.post('/:team_id/newAccessCode', isAuth, checkTeamMembership, isCoach, newAC);
router.get('/:team_id/:node_id/tasks', isAuth, checkTeamMembership, getNodeTasks); // Assuming this is the correct route for fetching levels
router.post('/:team_id/flow', isAuth, checkTeamMembership, isCoach, postFlow);
router.post('/:team_id/node-label', isAuth, checkTeamMembership, isCoach, updateNodeLabel);
router.post('/:team_id/:node_id/tasks', isAuth, checkTeamMembership, isCoach, postCreateTask);
router.put('/:team_id/:node_id/tasks/order', isAuth, checkTeamMembership, isCoach, updateTaskOrder);
router.patch('/:team_id/editDescription', isAuth, checkTeamMembership, isCoach, editDescription);
router.delete('/:team_id/player/:player_id', isAuth, checkTeamMembership, isCoach, deletePlayer);
router.delete('/:team_id/delAccessCode', isAuth, checkTeamMembership, isCoach, deleteAC);
router.delete('/:team_id/:node_id/tasks/:task_id', isAuth, checkTeamMembership, isCoach, deleteTask);

export default router;