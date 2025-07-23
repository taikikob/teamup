import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.BUCKET_SECRET_KEY!
    }
});

export const handlePostCoachResource = async (req: Request, res: Response) => {
    console.log("handlePostCoachResource called");
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
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `coach/${req.body.taskId}/${Date.now()}_${req.file.originalname}`,
        Body: fileBuffer,
        ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    const caption = req.body.caption;
    console.log("Caption:", caption);
    res.status(201).json({ message: 'Resource uploaded successfully' });
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