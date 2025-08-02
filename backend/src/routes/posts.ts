import { Router } from 'express';
import { isAuth, isCoach } from '../lib/authMiddleware';
import upload from '../lib/multerMiddlware';
import { postCoachResource, postPlayerSubmission, getCoachResources, getPlayerSubmissions, getSubmission, getMySubmissions, deletePost } from '../handlers/posts';

const router = Router();

router.get('/coachResources/:taskId', isAuth, getCoachResources);
router.get('/playerSubmissions/:team_id/:taskId', isAuth, isCoach, getPlayerSubmissions);
router.get('/myMedia/:taskId', isAuth, getMySubmissions);
router.get('/playerSubmission/:team_id/:taskId/:player_id', isAuth, isCoach, getSubmission);
// if I want to use isCoach, I make sure team_id is in the url

router.post('/:team_id/coach', isAuth, isCoach, upload.single('media'), postCoachResource);
router.post('/player', isAuth, upload.single('media'), postPlayerSubmission);

router.delete('/', isAuth, deletePost);

export default router;