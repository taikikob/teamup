"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.postPlayerSubmission = exports.postCoachResource = exports.postTeamImage = exports.postProfilePicture = exports.getProfilePicture = exports.getMySubmissions = exports.getSubmission = exports.getPlayerSubmissions = exports.getCoachResources = void 0;
const db_1 = __importDefault(require("../db"));
const client_s3_1 = require("@aws-sdk/client-s3");
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const getMediaLinkHelper_1 = require("../lib/getMediaLinkHelper");
const s3_1 = __importDefault(require("../s3"));
const s3utils_1 = require("../lib/s3utils");
const cloudFrontUtils_1 = require("../lib/cloudFrontUtils");
// When getting image data, we have to attatch the url to the returned object
const getCoachResources = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    // find all resouraces for this task
    try {
        // order by created_at DESC
        const result = yield db_1.default.query('SELECT * FROM posts WHERE task_id = $1 AND media_type = $2 ORDER BY created_at DESC', [taskId, 'coach_resource']);
        // Attaching signed cdn url to each post
        // Calculate expiration time in seconds (Unix timestamp)
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const posts = yield Promise.all(result.rows.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const url = (0, cloudfront_signer_1.getSignedUrl)({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${post.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
                dateLessThan: expirationDate
            }); // URL valid for 1 hour
            return Object.assign(Object.assign({}, post), { media_url: url });
        })));
        res.json(posts);
    }
    catch (error) {
        console.error("Error fetching coach resources:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
exports.getCoachResources = getCoachResources;
const getPlayerSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const team_id = req.params.team_id;
    const taskId = req.params.taskId;
    // find all player submissions for this task, 
    // return an object for each user that is a part of the team
    try {
        const allPlayers = yield db_1.default.query(`SELECT u.user_id, u.first_name, u.last_name
            FROM users u
            JOIN team_memberships tm ON u.user_id = tm.user_id
            WHERE tm.team_id = $1 AND tm.role = $2;`, [team_id, 'Player']);
        // For all players, check if they have submitted or is completed
        const players = yield Promise.all(allPlayers.rows.map((player) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            // Check if the player has submitted
            const submitted = yield db_1.default.query(`SELECT submitted_at FROM task_submissions WHERE task_id = $1 AND player_id = $2`, [taskId, player.user_id]);
            // Check if the player has completed
            const completed = yield db_1.default.query(`SELECT completed_at FROM task_completions WHERE task_id = $1 AND player_id = $2`, [taskId, player.user_id]);
            // If submitted, get the submission timestamp
            const submittedAt = ((_a = submitted.rows[0]) === null || _a === void 0 ? void 0 : _a.submitted_at) || null;
            // If completed, get the completion timestamp
            const completedAt = ((_b = completed.rows[0]) === null || _b === void 0 ? void 0 : _b.completed_at) || null;
            return Object.assign(Object.assign({}, player), { task_id: taskId, isSubmitted: Boolean(submitted && typeof submitted.rowCount === "number" && submitted.rowCount > 0), isComplete: Boolean(completed && typeof completed.rowCount === "number" && completed.rowCount > 0), submitted_at: submittedAt, completed_at: completedAt });
        })));
        // Get all submissions for this task    
        const result = yield db_1.default.query(`SELECT p.user_id, u.first_name, u.last_name, p.media_name, p.created_at, p.media_format
            FROM posts p JOIN users u ON p.user_id = u.user_id 
            WHERE p.task_id = $1 AND p.media_type = $2 
            ORDER BY p.created_at DESC`, [taskId, 'player_submission']);
        // Attach the signed cdn URL to each post
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const submissions = yield Promise.all(result.rows.map((submission) => __awaiter(void 0, void 0, void 0, function* () {
            const url = (0, cloudfront_signer_1.getSignedUrl)({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${submission.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
                dateLessThan: expirationDate
            }); // URL valid for 1 hour
            return Object.assign(Object.assign({}, submission), { media_url: url });
        })));
        // Attach submissions to each player
        const playersWithSubmissions = players.map(player => {
            const playerSubmissions = submissions.filter(sub => sub.user_id === player.user_id);
            return Object.assign(Object.assign({}, player), { submissions: playerSubmissions });
        });
        console.log("Players with submissions:", playersWithSubmissions);
        res.json(playersWithSubmissions);
    }
    catch (error) {
        console.error("Error fetching player submissions:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
exports.getPlayerSubmissions = getPlayerSubmissions;
// get a specific player's submission for a task
const getSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    const playerId = req.params.player_id;
    try {
        // 1. Get player info
        const userResult = yield db_1.default.query(`SELECT user_id, first_name, last_name FROM users WHERE user_id = $1`, [playerId]);
        if (userResult.rowCount === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const user = userResult.rows[0];
        // 2. Get submission status
        const submissionResult = yield db_1.default.query(`SELECT submitted_at FROM task_submissions WHERE player_id = $1 AND task_id = $2`, [playerId, taskId]);
        const isSubmitted = Boolean(submissionResult && typeof submissionResult.rowCount === "number" && submissionResult.rowCount > 0);
        const submitted_at = isSubmitted ? submissionResult.rows[0].submitted_at : null;
        // 3. Get completion status
        const completionResult = yield db_1.default.query(`SELECT completed_at FROM task_completions WHERE player_id = $1 AND task_id = $2`, [playerId, taskId]);
        const isComplete = Boolean(completionResult && typeof completionResult.rowCount === "number" && completionResult.rowCount > 0);
        const completed_at = isComplete ? completionResult.rows[0].completed_at : null;
        // 4. Get all submissions (media)
        const postsResult = yield db_1.default.query(`SELECT post_id, media_name, created_at, media_format
            FROM posts
            WHERE user_id = $1 AND task_id = $2 AND media_type = 'player_submission'
            ORDER BY created_at ASC`, [playerId, taskId]);
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const submissions = yield Promise.all(postsResult.rows.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const url = (0, cloudfront_signer_1.getSignedUrl)({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${post.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
                dateLessThan: expirationDate
            });
            return {
                post_id: post.post_id,
                media_url: url,
                created_at: post.created_at,
                media_format: post.media_format,
            };
        })));
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
    }
    catch (error) {
        console.error("Error fetching player submission:", error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
exports.getSubmission = getSubmission;
const getMySubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const taskId = req.params.taskId;
    try {
        // Get all submissions for this user and task
        const result = yield db_1.default.query(`SELECT media_name, created_at, media_format, post_id
             FROM posts
             WHERE task_id = $1 AND media_type = $2 AND user_id = $3
             ORDER BY created_at DESC`, [taskId, 'player_submission', user.user_id]);
        // Attach the S3 URL to each post
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const submissions = yield Promise.all(result.rows.map((submission) => __awaiter(void 0, void 0, void 0, function* () {
            const url = (0, cloudfront_signer_1.getSignedUrl)({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${submission.media_name}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
                dateLessThan: expirationDate
            }); // URL valid for 1 hour
            return {
                media_url: url,
                created_at: submission.created_at,
                media_format: submission.media_format,
                post_id: submission.post_id
            };
        })));
        // Compose the PlayerSubmission object
        const playerSubmission = {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            submissions
        };
        res.json(playerSubmission);
    }
    catch (error) {
        console.error("Error fetching my submissions:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getMySubmissions = getMySubmissions;
const getProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    try {
        const profile_picture_link = yield (0, getMediaLinkHelper_1.getProfilePictureUrl)(user.user_id);
        res.json({ profile_picture_link });
    }
    catch (error) {
        console.error("Error fetching profile picture:", error);
        res.status(500).json({ error: 'Failed to fetch profile picture' });
    }
});
exports.getProfilePicture = getProfilePicture;
const randomImageName = (bytes = 32) => crypto_1.default.randomBytes(bytes).toString('hex');
const postProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    // Additional file validation
    if (!req.file.mimetype.startsWith('image/')) {
        res.status(400).json({ error: 'File must be an image' });
        return;
    }
    let imageName;
    let oldImageName = null;
    try {
        // Check if user already has a profile picture BEFORE uploading new one
        const existingPicture = yield db_1.default.query(`SELECT media_name FROM profile_pictures WHERE user_id = $1`, [user.user_id]);
        if (existingPicture.rows.length > 0) {
            oldImageName = existingPicture.rows[0].media_name;
        }
        // Resize and prepare the image
        const buffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize({ width: 400, height: 400, fit: 'cover' }) // Ensure square aspect ratio
            .jpeg({ quality: 85 }) // Optimize for web
            .toBuffer();
        imageName = randomImageName();
        // Upload to S3
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: imageName,
            Body: buffer,
            ContentType: 'image/jpeg', // Force JPEG after Sharp processing
            CacheControl: 'max-age=31536000', // 1 year cache
        };
        const command = new client_s3_1.PutObjectCommand(params);
        yield s3_1.default.send(command);
        // Update database
        if (oldImageName) {
            // Update existing record
            yield db_1.default.query(`UPDATE profile_pictures SET media_name = $1, created_at = CURRENT_TIMESTAMP WHERE user_id = $2`, [imageName, user.user_id]);
        }
        else {
            // Insert new record
            yield db_1.default.query(`INSERT INTO profile_pictures (user_id, media_name, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`, [user.user_id, imageName]);
        }
        // Clean up old image AFTER successful database update
        if (oldImageName) {
            try {
                yield (0, s3utils_1.deleteFile)(oldImageName);
                // Invalidate cache for old image (don't await, let it run in background)
                (0, cloudFrontUtils_1.invalidateCache)(oldImageName).catch(error => console.error("Error invalidating cache for old profile picture:", error));
            }
            catch (error) {
                // Log but don't fail the request - the main operation succeeded
                console.error("Error deleting old profile picture from S3:", error);
            }
        }
        res.status(201).json({
            message: 'Profile picture updated successfully',
            imageUrl: `${process.env.CLOUDFRONT_URL}/${imageName}` // Return the URL
        });
    }
    catch (error) {
        console.error("Error updating profile picture:", error);
        // If we uploaded to S3 but database failed, clean up the new image
        if (imageName) {
            try {
                yield (0, s3utils_1.deleteFile)(imageName);
            }
            catch (cleanupError) {
                console.error("Error cleaning up uploaded file after database failure:", cleanupError);
            }
        }
        if (error instanceof Error) {
            // Handle specific Sharp errors
            if (error.message.includes('Input file contains unsupported image format')) {
                res.status(400).json({ error: 'Unsupported image format' });
                return;
            }
        }
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});
exports.postProfilePicture = postProfilePicture;
const postTeamImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const team_id = req.params.team_id;
    // Resize the image
    // Actual image data that needs to be sent to s3
    const isImage = req.file.mimetype.startsWith('image/');
    let buffer;
    if (isImage) {
        buffer = yield (0, sharp_1.default)(req.file.buffer).resize({ width: 400 }).toBuffer();
    }
    else {
        // Videos are not allowed for team images
        res.status(400).json({ error: 'Only images are allowed for team images' });
        return;
    }
    const imageName = randomImageName();
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
    };
    const command = new client_s3_1.PutObjectCommand(params);
    try {
        yield s3_1.default.send(command);
    }
    catch (error) {
        console.error("Error uploading to S3:", error);
        res.status(500).json({ error: 'Failed to upload resource' });
        return;
    }
    const client = yield db_1.default.connect();
    try {
        yield client.query('BEGIN');
        // check if team_img_name already exists for this team
        const existingImageName = yield client.query(`SELECT team_img_name FROM teams WHERE team_id = $1`, [team_id]);
        const oldImageName = (_a = existingImageName.rows[0]) === null || _a === void 0 ? void 0 : _a.team_img_name;
        if (oldImageName) {
            // Delete the old image from S3
            yield (0, s3utils_1.deleteFile)(oldImageName);
            // Invalidate cache for old image (don't await, let it run in background)
            (0, cloudFrontUtils_1.invalidateCache)(oldImageName).catch(error => console.error("Error invalidating cache for old team image:", error));
        }
        // Update the team image in the database
        yield client.query(`UPDATE teams SET team_img_name = $1 WHERE team_id = $2`, [imageName, team_id]);
        yield client.query('COMMIT');
    }
    catch (error) {
        yield client.query('ROLLBACK');
        console.error("Error updating team image:", error);
        res.status(500).json({ error: 'Failed to update team image' });
    }
    finally {
        client.release();
        res.status(201).json({ message: 'Team image updated successfully' });
    }
});
exports.postTeamImage = postTeamImage;
const postCoachResource = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
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
    let buffer;
    if (isImage) {
        buffer = yield (0, sharp_1.default)(req.file.buffer).resize({ width: 400 }).toBuffer();
    }
    else {
        buffer = req.file.buffer; // Don't process videos or other files
    }
    const imageName = randomImageName();
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
    };
    const command = new client_s3_1.PutObjectCommand(params);
    try {
        yield s3_1.default.send(command);
    }
    catch (error) {
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
        yield db_1.default.query('INSERT INTO posts (user_id, task_id, caption, media_name, media_type, media_format) VALUES ($1, $2, $3, $4, $5, $6)', [user.user_id, taskId, caption, imageName, 'coach_resource', mediaFormat]);
        res.status(201).json({ message: 'Resource uploaded successfully' });
    }
    catch (error) {
        console.error("Error inserting post:", error);
        res.status(500).json({ error: 'Failed to save resource details' });
        return;
    }
});
exports.postCoachResource = postCoachResource;
const postPlayerSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
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
    let buffer;
    if (isImage) {
        buffer = yield (0, sharp_1.default)(req.file.buffer).resize({ width: 400 }).toBuffer();
    }
    else {
        buffer = req.file.buffer; // Don't process videos or other files
    }
    const imageName = randomImageName();
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
    };
    const command = new client_s3_1.PutObjectCommand(params);
    try {
        yield s3_1.default.send(command);
    }
    catch (error) {
        console.error("Error uploading to S3:", error);
        res.status(500).json({ error: 'Failed to upload resource' });
        return;
    }
    // save details to the database
    const taskId = Number(req.body.taskId);
    const mediaFormat = isImage ? 'image' : (req.file.mimetype.startsWith('video/') ? 'video' : 'other');
    try {
        // Insert post info to the database
        yield db_1.default.query('INSERT INTO posts (user_id, task_id, media_name, media_type, media_format) VALUES ($1, $2, $3, $4, $5)', [user.user_id, taskId, imageName, 'player_submission', mediaFormat]);
        res.status(201).json({ message: 'Resource uploaded successfully' });
    }
    catch (error) {
        console.error('Error inserting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.postPlayerSubmission = postPlayerSubmission;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.BUCKET_NAME || !process.env.CLOUDFRONT_DISTRIBUTION_ID) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }
    console.log("Deleting post with body:", req.body);
    const user = req.user;
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
        const result = yield db_1.default.query('SELECT media_name FROM posts WHERE post_id = $1 AND user_id = $2', [postId, user.user_id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Post not found or does not belong to user' });
            return;
        }
        const mediaName = result.rows[0].media_name;
        yield (0, s3utils_1.deleteFile)(mediaName);
        yield (0, cloudFrontUtils_1.invalidateCache)(mediaName);
        // Delete the post from the database
        yield db_1.default.query('DELETE FROM posts WHERE post_id = $1', [postId]);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deletePost = deletePost;
