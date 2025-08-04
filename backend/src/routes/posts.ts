import { Router } from 'express';
import { checkTeamMembership, isAuth, isCoach } from '../lib/authMiddleware';
import upload from '../lib/multerMiddlware';
import { postProfilePicture, postCoachResource, postPlayerSubmission, getCoachResources, getPlayerSubmissions, getSubmission, getMySubmissions, deletePost } from '../handlers/posts';

const router = Router();

router.get('/coachResources/:team_id/:taskId', isAuth, getCoachResources);
router.get('/playerSubmissions/:team_id/:taskId', isAuth, isCoach, checkTeamMembership, getPlayerSubmissions);
router.get('/myMedia/:team_id/:taskId', isAuth, checkTeamMembership, getMySubmissions);
router.get('/playerSubmission/:team_id/:taskId/:player_id', isAuth, isCoach, checkTeamMembership, getSubmission);
// if I want to use isCoach, I make sure team_id is in the url

// Profile picture upload endpoint can be used without being in a team
router.post('/pp', isAuth, upload.single('profile_picture'), postProfilePicture);
router.post('/:team_id/coach', isAuth, isCoach, checkTeamMembership, upload.single('media'), postCoachResource);
router.post('/:team_id/player', isAuth, checkTeamMembership, upload.single('media'), postPlayerSubmission);

router.delete('/:team_id', isAuth, checkTeamMembership, deletePost);

export default router;