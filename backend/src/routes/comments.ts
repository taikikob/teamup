import { Router } from 'express';
import { isAuth, isCoach } from '../lib/authMiddleware';
import { } from '../handlers/comments';

const router = Router();
// all routes using isCoach should have team_id in the url


export default router;