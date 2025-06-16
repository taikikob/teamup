import { Router } from 'express';
import { postLogin, postSignup } from '../handlers/auth';

const router = Router();

// /api/auth/signup
router.post('/signup', postSignup);

router.post('/login', postLogin);

export default router;