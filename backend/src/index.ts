import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import teamsRouter from './routes/teams'
import postsRouter from './routes/posts';
import tasksRouter from './routes/tasks';
import commentsRouter from './routes/comments';
import notificationRouter from './routes/notification'
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // tells Express to trust the reverse proxy (like Vercel) so that features like secure: true cookies will work correctly.
const PORT = 3000;
const PgSession = connectPgSimple(session);

// // Middleware
// app.use(cors({
//   origin: [
//     'http://localhost:5173', // local dev frontend
//     'https://www.casatrain.com'   // production frontend
//   ],
//   credentials: true 
// }));

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist_frontend')));
// express-session middleware configuration

// using postgreSQL database to store session
app.use(
  session({
    store: new PgSession({
      pool: pool, // Connection pool
      tableName: 'sessions', 
    }),
    secret: process.env.SESSION_SECRET!, // Replace with your own secret key, usually an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
      secure: true, // since we're using https
      sameSite: 'lax' // Adjust based on your deployment (e.g., 'lax' or 'strict' for same-site requests)
    }
  })
);

// Need to require the entire Passport config module so app.js knows about it
import "./passport";

app.use(passport.initialize());
app.use(passport.session());

// custom middleware to see how passport works
// session is created by express session
// user is created by passport
app.use((req, res, next) => {
  console.log(req.session);
  console.log(req.user);
  next();
});

app.use(express.static('dist_frontend'));

// first argument is the path prefix for the routes in auth.ts
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notif', notificationRouter);

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist_frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});

// ERROR HANDLER SHOULD GO HERE FOR PRODUCTION