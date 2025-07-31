import { Router } from 'express';
import { isAuth, isCoach } from '../lib/authMiddleware';
import { getTaskStatus, postTaskSubmit, postTaskComplete, postTaskUnapprove, deleteTaskSubmit } from '../handlers/tasks';

const router = Router();
// all routes using isCoach should have team_id in the url
// Used
router.get('/status/:taskId', isAuth, getTaskStatus);
router.post('/submit/:taskId', isAuth, postTaskSubmit);
// Used from MarkCompleteButton
router.post('/:team_id/:taskId/complete', isAuth, isCoach, postTaskComplete);
router.post('/:team_id/:taskId/unapprove', isAuth, isCoach, postTaskUnapprove);
router.delete('/unsubmit/:taskId', isAuth, deleteTaskSubmit);

export default router;