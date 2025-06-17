import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db';

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
app.use(
  session({
    store: new PgSession({
      pool: pool, // Connection pool
      tableName: 'sessions', 
    }),
    secret: 'your-secret-key', // Replace with your own secret key, usually an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day expiration
    }
  })
);

// first argument is the path prefix for the routes in auth.ts
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});