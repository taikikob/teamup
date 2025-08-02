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

export const markAsRead = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const notification_id = parseInt(req.params.id, 10);
    try {
        const result = await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2 RETURNING *`,
            [notification_id, user.user_id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Notification not found or already read' });
            return;
        }
        res.status(200).json(result.rows[0]);
        return;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const markAsUnread = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const notification_id = parseInt(req.params.id, 10);
    try {
        const result = await pool.query(
            `UPDATE notifications SET is_read = FALSE WHERE notification_id = $1 AND user_id = $2 RETURNING *`,
            [notification_id, user.user_id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Notification not found or already unread' });
            return;
        }
        res.status(200).json(result.rows[0]);
        return;
    } catch (error) {
        console.error('Error marking notification as unread:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}