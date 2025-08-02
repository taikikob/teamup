import { Router } from 'express';
import { isAuth, checkTeamMembership } from '../lib/authMiddleware';
import { getCommentsForTask, addComment, deleteComment } from '../handlers/comments';

const router = Router();
// all routes using isCoach or checkTeamMembership should have team_id in the url
router.get('/:team_id/:taskId', isAuth, checkTeamMembership, getCommentsForTask);
router.post('/:team_id', isAuth, checkTeamMembership, addComment);
router.delete('/:team_id/:commentId', isAuth, checkTeamMembership, deleteComment);


export default router;