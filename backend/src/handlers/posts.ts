import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";

export const handlePostCoachResource = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const fileBuffer = req.file.buffer; // Actual image data that needs to be sent to s3
    const { caption } = req.body;
}

export const handlePostPlayerSubmission = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { caption } = req.body;

    // Assuming the file is uploaded and available in req.file
    // TODO FROM HERE
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    try {
        const result = await pool.query(
            'INSERT INTO posts (user_id, caption, media_url) VALUES ($1, $2, $3) RETURNING *',
            [user.user_id, caption, req.file.path]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error inserting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}