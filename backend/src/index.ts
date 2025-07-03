import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import teamRouter from './routes/team'
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db';
import passport from 'passport';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const PgSession = connectPgSimple(session);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL in production
  credentials: true 
}));

app.use(express.json());
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
}) ;

// first argument is the path prefix for the routes in auth.ts
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/team', teamRouter);

app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});

// ERROR HANDLER SHOULD GO HERE FOR PRODUCTION