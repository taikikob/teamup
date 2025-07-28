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
    const team_id = req.params.team_id;
    const taskId = req.params.taskId;
    // find all player submissions for this task, 
    // return an object for each user that is a part of the team

    try {
        const allPlayers = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name
            FROM users u
            JOIN team_memberships tm ON u.user_id = tm.user_id
            WHERE tm.team_id = $1 AND tm.role = $2;`,
            [team_id, 'Player']
        );

        // For all players, check if they have submitted or is completed
        const players = await Promise.all(
            allPlayers.rows.map(async (player) => {
                // Check if the player has submitted
                const submitted = await pool.query(
                `SELECT submitted_at FROM task_submissions WHERE task_id = $1 AND player_id = $2`,
                [taskId, player.user_id]
                );
                // Check if the player has completed
                const completed = await pool.query(
                `SELECT completed_at FROM task_completions WHERE task_id = $1 AND player_id = $2`,
                [taskId, player.user_id]
                );
                // If submitted, get the submission timestamp
                const submittedAt = submitted.rows[0]?.submitted_at || null;
                // If completed, get the completion timestamp
                const completedAt = completed.rows[0]?.completed_at || null;
                return {
                    ...player,
                    task_id: taskId,
                    isSubmitted: Boolean(submitted && typeof submitted.rowCount === "number" && submitted.rowCount > 0),
                    isComplete: Boolean(completed && typeof completed.rowCount === "number" && completed.rowCount > 0),
                    submitted_at: submittedAt,
                    completed_at: completedAt
                };
            })
        );

        // Get all submissions for this task    
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
            const url = getSignedUrl(
                {
                    url: `https://${process.env.CLOUDFRONT_DOMAIN}/${submission.media_name}`,
                    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
                    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
                    dateLessThan: expirationDate
                }
            ); // URL valid for 1 hour
            return { ...submission, media_url: url };
        }));
        // Attach submissions to each player
        const playersWithSubmissions = players.map(player => {
            const playerSubmissions = submissions.filter(sub => sub.user_id === player.user_id);
            return {
                ...player,
                submissions: playerSubmissions
            };
        });
        console.log("Players with submissions:", playersWithSubmissions);
        res.json(playersWithSubmissions);
    } catch (error) {
        console.error("Error fetching player submissions:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

// get a specific player's submission for a task
export const getSubmission = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    const playerId = req.params.player_id;
    try {
        // 1. Get player info
        const userResult = await pool.query(
            `SELECT user_id, first_name, last_name FROM users WHERE user_id = $1`,
            [playerId]
        );
        if (userResult.rowCount === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const user = userResult.rows[0];

        // 2. Get submission status
        const submissionResult = await pool.query(
            `SELECT submitted_at FROM task_submissions WHERE player_id = $1 AND task_id = $2`,
            [playerId, taskId]
        );
        const isSubmitted = Boolean(submissionResult && typeof submissionResult.rowCount === "number" && submissionResult.rowCount > 0);
        const submitted_at = isSubmitted ? submissionResult.rows[0].submitted_at : null;

        // 3. Get completion status
        const completionResult = await pool.query(
            `SELECT completed_at FROM task_completions WHERE player_id = $1 AND task_id = $2`,
            [playerId, taskId]
        );
        const isComplete = Boolean(completionResult && typeof completionResult.rowCount === "number" && completionResult.rowCount > 0);
        const completed_at = isComplete ? completionResult.rows[0].completed_at : null;

        // 4. Get all submissions (media)
        const postsResult = await pool.query(
            `SELECT post_id, media_name, created_at, media_format
            FROM posts
            WHERE user_id = $1 AND task_id = $2 AND media_type = 'player_submission'
            ORDER BY created_at ASC`,
            [playerId, taskId]
        );

        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const submissions = await Promise.all(postsResult.rows.map(async (post) => {
            const url = getSignedUrl({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${post.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
                dateLessThan: expirationDate
            });
            return {
                post_id: post.post_id,
                media_url: url,
                created_at: post.created_at,
                media_format: post.media_format,
            };
        }));

        // 5. Build and return the PlayerSubmission object
        const playerSubmission = {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            task_id: taskId,
            isComplete,
            isSubmitted,
            completed_at,
            submitted_at,
            submissions,
        };

        res.json(playerSubmission);
    } catch (error) {
        console.error("Error fetching player submission:", error);
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