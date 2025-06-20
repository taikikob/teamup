import { Router } from 'express';
import { postLogin, postSignup } from '../handlers/auth';
import passport from 'passport';

const router = Router();

// /api/auth/signup
router.post('/signup', postSignup);

// passport is a middleware, the done function is the next function
// if the login credentials that user provides to this api route is valid
// passport lets us in to postLogin
router.post('/login', passport.authenticate('local'), postLogin);

export default router;