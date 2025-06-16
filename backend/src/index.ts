import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// first argument is the path prefix for the routes in auth.ts
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});