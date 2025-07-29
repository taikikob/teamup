import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";
import type { Comment } from "../types/Comment";

export const getCommentsForTask = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC`,
            [taskId]
        );
        // attach sender_name to each comment
        const commentsWithSenderName = await Promise.all(result.rows.map(async (comment: Comment) => {
            const senderResult = await pool.query(
                `SELECT first_name, last_name FROM users WHERE user_id = $1`,
                [comment.sender_id]
            );
            const sender = senderResult.rows[0];
            return {
                ...comment,
                sender_name: `${sender.first_name} ${sender.last_name}`
            };
        }));
        res.status(200).json(commentsWithSenderName);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addComment = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const comment: Omit<Comment, "comment_id" | "created_at" | "sender_name"> = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO comments (player_id, sender_id, task_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
            [comment.player_id, comment.sender_id, comment.task_id, comment.content]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { commentId } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM comments WHERE comment_id = $1 RETURNING *`,
            [commentId]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}