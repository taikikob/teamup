import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
   try {
        const { email, password } = req.body;


        const userExists = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        // TODO: PASSWORD HASHING + INSERT LOGIC
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error('Unknown error', err);
        }
    }
});

export default router;