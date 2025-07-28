import { Router } from 'express';
import { isAuth } from '../lib/authMiddleware';
import upload from '../lib/multerMiddlware';
import { postCoachResource, postPlayerSubmission, getCoachResources, getPlayerSubmissions, getMySubmissions, deletePost } from '../handlers/posts';

const router = Router();

router.get('/coachResources/:taskId', isAuth, getCoachResources);
router.get('/playerSubmissions/:taskId', isAuth, getPlayerSubmissions);
router.get('/myMedia/:taskId', isAuth, getMySubmissions);
// if I want to use isCoach, I make sure team_id is in the url

router.post('/coach', isAuth, upload.single('media'), postCoachResource);
router.post('/player', isAuth, upload.single('media'), postPlayerSubmission);

router.delete('/', isAuth, deletePost);

export default router;
