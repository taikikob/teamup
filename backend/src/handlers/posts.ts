import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from 'sharp';
import crypto from 'crypto';
import {getSignedUrl} from "@aws-sdk/cloudfront-signer"
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

const s3 = new S3Client({
    region: process.env.BUCKET_REGION,
    credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.BUCKET_SECRET_KEY!
    }
});

const cloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.BUCKET_SECRET_KEY!
    }
});

// When getting image data, we have to attatch the url to the returned object
export const getCoachResources = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    // find all resouraces for this task
    try {
        // order by created_at DESC
        const result = await pool.query(
            'SELECT * FROM posts WHERE task_id = $1 AND media_type = $2 ORDER BY created_at DESC',
            [taskId, 'coach_resource']
        );
        
        // Attaching signed cdn url to each post
        // Calculate expiration time in seconds (Unix timestamp)
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const posts = await Promise.all(result.rows.map(async (post) => {
            const url = getSignedUrl({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${post.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
                dateLessThan: expirationDate
            }); // URL valid for 1 hour
            return { ...post, media_url: url };
        }));
        res.json(posts);
    } catch (error) {
        console.error("Error fetching coach resources:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

export const getPlayerSubmissions = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    // find all player submissions for this task
    try {
        const result = await pool.query(
            `SELECT p.user_id, u.first_name, u.last_name, p.media_name, p.created_at, p.media_format
            FROM posts p JOIN users u ON p.user_id = u.user_id 
            WHERE p.task_id = $1 AND p.media_type = $2 
            ORDER BY p.created_at DESC`,
            [taskId, 'player_submission']
        );
        // Attach the signed cdn URL to each post
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const submissions = await Promise.all(result.rows.map(async (submission) => {
            const url = await getSignedUrl(
                {
                    url: `https://${process.env.CLOUDFRONT_DOMAIN}/${submission.media_name}`,
                    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
                    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
                    dateLessThan: expirationDate
                }
            ); // URL valid for 1 hour
            return { ...submission, media_url: url };
        }));
        const grouped: { [userId: number]: {
            user_id: number;
            first_name: string;
            last_name: string;
            task_id: string;
            isComplete: boolean;
            isSubmitted: boolean;
            submissions: {
                post_id: number; 
                media_url: string;
                created_at: string;
                media_format: string;
            }[];
        }} = {};
        for (const sub of submissions) {
            // if user hasn't been seen yet
            if (!grouped[sub.user_id]) {
                // check if this submission has been markeed as complete
                const isComplete = await pool.query(
                    `SELECT 1 FROM task_completions WHERE task_id = $1 AND player_id = $2`,
                    [taskId, sub.user_id]
                );
                const isSubmitted = await pool.query(
                    `SELECT 1 FROM task_submissions WHERE task_id = $1 AND player_id = $2`,
                    [taskId, sub.user_id]
                )
                grouped[sub.user_id] = {
                    user_id: sub.user_id,
                    first_name: sub.first_name,
                    last_name: sub.last_name,
                    task_id: taskId,
                    isComplete: Boolean(isComplete?.rowCount && isComplete.rowCount > 0),
                    isSubmitted: Boolean(isSubmitted?.rowCount && isSubmitted.rowCount > 0),
                    submissions: []
                };
            }
            // push the submission to the user's submissions
            grouped[sub.user_id].submissions.push({
                post_id: sub.post_id, 
                media_url: sub.media_url,
                created_at: sub.created_at,
                media_format: sub.media_format
            });
        }
        const groupedArray = Object.values(grouped);
        res.json(groupedArray);
    } catch (error) {
        console.error("Error fetching player submissions:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

export const getMySubmissions = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    try {
        // Get all submissions for this user and task
        const result = await pool.query(
            `SELECT media_name, created_at, media_format, post_id
             FROM posts
             WHERE task_id = $1 AND media_type = $2 AND user_id = $3
             ORDER BY created_at DESC`,
            [taskId, 'player_submission', user.user_id]
        );
        // Attach the S3 URL to each post
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const submissions = await Promise.all(result.rows.map(async (submission) => {
            const url = getSignedUrl({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${submission.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
                dateLessThan: expirationDate
            }); // URL valid for 1 hour
            return { 
                media_url: url,
                created_at: submission.created_at,
                media_format: submission.media_format,
                post_id: submission.post_id };
        }));

        // Compose the PlayerSubmission object
        const playerSubmission = {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            submissions
        };

        res.json(playerSubmission);
    } catch (error) {
        console.error("Error fetching my submissions:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const postCoachResource = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    // check that taskId is provided
    if (!req.body.taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
    }

    // Resize the image
    // Actual image data that needs to be sent to s3
    const isImage = req.file.mimetype.startsWith('image/');
    let buffer: Buffer;

    if (isImage) {
        buffer = await sharp(req.file.buffer).resize({ width: 400 }).toBuffer();
    } else {
        buffer = req.file.buffer; // Don't process videos or other files
    }
    const imageName = randomImageName();
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    try {
       await s3.send(command); 
    } catch (error) {
       console.error("Error uploading to S3:", error);
       res.status(500).json({ error: 'Failed to upload resource' });
       return;
    }
    // save details to the database
    const caption = req.body.caption;
    const taskId = Number(req.body.taskId);
    const mediaFormat = isImage ? 'image' : (req.file.mimetype.startsWith('video/') ? 'video' : 'other');
    try {
        // Insert post info to the database
        await pool.query(
            'INSERT INTO posts (user_id, task_id, caption, media_name, media_type, media_format) VALUES ($1, $2, $3, $4, $5, $6)',
            [user.user_id, taskId, caption, imageName, 'coach_resource', mediaFormat]
        );
        res.status(201).json({ message: 'Resource uploaded successfully' });
    } catch (error) {
        console.error("Error inserting post:", error);
        res.status(500).json({ error: 'Failed to save resource details' });
        return;
    }
}

export const postPlayerSubmission = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    // check that taskId is provided
    if (!req.body.taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
    }

    const isImage = req.file.mimetype.startsWith('image/');
    let buffer: Buffer;

    if (isImage) {
        buffer = await sharp(req.file.buffer).resize({ width: 400 }).toBuffer();
    } else {
        buffer = req.file.buffer; // Don't process videos or other files
    }
    const imageName = randomImageName();
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
    };
    
    const command = new PutObjectCommand(params);
    try {
       await s3.send(command); 
    } catch (error) {
       console.error("Error uploading to S3:", error);
       res.status(500).json({ error: 'Failed to upload resource' });
       return;
    }

    // save details to the database
    const taskId = Number(req.body.taskId);
    const mediaFormat = isImage ? 'image' : (req.file.mimetype.startsWith('video/') ? 'video' : 'other');
    try {
        // Insert post info to the database
        await pool.query(
            'INSERT INTO posts (user_id, task_id, media_name, media_type, media_format) VALUES ($1, $2, $3, $4, $5)',
            [user.user_id, taskId, imageName, 'player_submission', mediaFormat]
        );
        res.status(201).json({ message: 'Resource uploaded successfully' });
    } catch (error) {
        console.error('Error inserting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const deletePost = async (req: Request, res: Response) => {
    console.log("Deleting post with body:", req.body);
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const postId = req.body.postId;
    if (!postId) {
        res.status(400).json({ error: 'Post ID is required' });
        return;
    }
    
    try {
        // Check if the post exists and belongs to the user
        const result = await pool.query(
            'SELECT media_name FROM posts WHERE post_id = $1 AND user_id = $2',
            [postId, user.user_id]
        );
        
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Post not found or does not belong to user' });
            return;
        }

        const mediaName = result.rows[0].media_name;

        // Delete the file from S3
        const deleteParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: mediaName,
        };

        const command = new DeleteObjectCommand(deleteParams);
        // Delete the file from S3
        await s3.send(command);

        // Invalidate the cloudfront chache for this image
        const invalidationParams = {
            DistributionId: process.env.DISTRIBUTION_ID!,
            InvalidationBatch: {
                CallerReference: mediaName,
                Paths: {
                    Quantity: 1,
                    Items: [`/${mediaName}`]
                }
            }
        }
        const invalidationCommand = new CreateInvalidationCommand(invalidationParams);
        await cloudFront.send(invalidationCommand);
        // Delete the post from the database
        await pool.query('DELETE FROM posts WHERE post_id = $1', [postId]);

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}