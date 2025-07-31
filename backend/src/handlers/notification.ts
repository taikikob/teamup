import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";

export const getNotifications = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const userId = user.user_id;
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}