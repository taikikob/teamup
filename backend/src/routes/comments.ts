import { Router } from 'express';
import { isAuth, isCoach } from '../lib/authMiddleware';
import { getCommentsForTask, addComment, deleteComment } from '../handlers/comments';

const router = Router();
// all routes using isCoach should have team_id in the url
router.get('/:taskId', isAuth, getCommentsForTask);
router.post('/', isAuth, addComment);
router.delete('/:commentId', isAuth, deleteComment);


export default router;