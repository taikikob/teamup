import { Router } from 'express';
import { isAuth, isCoach } from '../lib/authMiddleware';
import upload from '../lib/multerMiddlware';
import { handlePostCoachResource, handlePostPlayerSubmission } from '../handlers/posts';

const router = Router();

//router.get('/', isAuth, handleGetPosts);

// if I want to use isCoach, I make sure team_id is in the url

router.post('/coach', isAuth, upload.single('image'), handlePostCoachResource);

router.post('/player', isAuth, upload.single('image'), handlePostPlayerSubmission);

export default router;
