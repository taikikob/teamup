import { Router } from 'express';
import { isAuth, isCoach, checkTeamMembership } from '../lib/authMiddleware';
import { getTaskStatus, postTaskSubmit, postTaskComplete, postTaskUnapprove, deleteTaskSubmit } from '../handlers/tasks';

const router = Router();
// all routes using isCoach or checkTeamMembership should have team_id in the url

router.get('/:team_id/status/:taskId', isAuth, checkTeamMembership, getTaskStatus);
router.post('/:team_id/submit/:taskId', isAuth, checkTeamMembership, postTaskSubmit);
// Used from MarkCompleteButton
router.post('/:team_id/:taskId/complete', isAuth, checkTeamMembership, isCoach, postTaskComplete);
router.post('/:team_id/:taskId/unapprove', isAuth, checkTeamMembership, isCoach, postTaskUnapprove);
router.delete('/:team_id/unsubmit/:taskId', isAuth, checkTeamMembership, deleteTaskSubmit);

export default router;