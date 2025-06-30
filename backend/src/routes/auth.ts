import { Router } from 'express';
import { postSignup } from '../handlers/auth';
import passport from 'passport';
import { isAuth } from '../lib/authMiddleware';

const router = Router();

// /api/auth/signup
router.post('/signup', postSignup);

// passport is a middleware, the done function is the next function
// if the login credentials that user provides to this api route is valid
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: Express.User | false, info: { message?: string } | undefined) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Login failed' });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ message: 'Login successful' });
    });
  })(req, res, next);
});

router.get('/me', isAuth, (req, res) => {
  res.json(req.user); 
});

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // or your session cookie name
      res.status(200).json({ msg: 'Logged out successfully' });
    });
  });
});

export default router;