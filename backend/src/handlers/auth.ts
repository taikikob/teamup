import { Request, Response } from "express-serve-static-core";
import pool from '../db'
import { SignupDto } from "../dtos/Signup.dto";
import { genPassword } from "../lib/passwordUtils";
import crypto from "crypto";
import { sendVerificationEmail } from "../nodeMailer";

export async function postSignup(request: Request<{},{}, SignupDto>, response: Response): Promise<void>{
    try {
        const { firstName, lastName, username, email, password } = request.body;
        if (!firstName || !lastName || !username || !email || !password) {
            response.status(400).json({ error: "Missing required fields" });
            return
        }
        const saltHash = genPassword(password);
        const salt = saltHash.salt;
        const hash = saltHash.hash;
        // Generate a random verification token
        const verificationToken = crypto.randomBytes(3).toString("hex");
        // Set token to expire in 15 minutes
        const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        // Check if unverified username already exists
        const client = await pool.connect();
        await client.query("BEGIN");
        const existingUser = await client.query("SELECT user_id FROM users WHERE username = $1 AND verified = $2", [username, false]);
        if (existingUser.rows.length > 0) {
            // Delete the existing unverified user
            await client.query("DELETE FROM users WHERE user_id = $1", [existingUser.rows[0].user_id]);
        }
        await client.query("INSERT INTO users (username, password_hash, salt, email, first_name, last_name, verification_token, verification_token_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [username, hash, salt, email, firstName, lastName, verificationToken, verificationTokenExpiresAt]
        );
        await client.query("COMMIT");
        client.release();
        await sendVerificationEmail(username, email, verificationToken);
        response.status(201).json({ message: "Signup successful. Please verify your email now."});
        return;
    } catch (error:any) {
        // Postgres unique_violation error code is 23505
        if (error.code === '23505') {
            response.status(409).json({ error: "Username already exists" });
            return;
        }
        console.error(error);
        response.status(500).json({ error: "Signup failed" });
        return;
    }
}

export async function isUsernameUnique(request: Request, response: Response): Promise<void> {
    const { username } = request.query;
    if (typeof username !== 'string' || username.trim() === '') {
        response.status(400).json({ isUnique: false, error: "Invalid username" });
        return;
    }
    
    try {
        const result = await pool.query(`
            SELECT 1 FROM users 
            WHERE username = $1 AND verified = $2`
            , [username, true]);
        const isUnique = result.rows.length === 0;
        response.json({ isUnique });
    } catch (error) {
        console.error("Database error during username uniqueness check:", error);
        response.status(500).json({ isUnique: false, error: "Internal Server Error" });
    }
}

export async function verifyEmailHandler(request: Request, response: Response): Promise<void> {
    const { code } = request.body;
    if (!code || typeof code !== 'string') {
        response.status(400).json({ message: "Invalid verification code" });
        return;
    }

    try {
        // Find user with the provided verification token
        console.log("Verifying email with code:", code);
        const now = new Date();
        const result = await pool.query("SELECT user_id FROM users WHERE verification_token = $1 AND verification_token_expires_at > $2", [code, now]);
        console.log("Verification result:", result.rows);
        if (result.rows.length === 0) {
            response.status(400).json({ message: "Invalid or expired verification code" });
            return;
        }

        const userId = result.rows[0].user_id;

        // Update user's email verification status
        await pool.query("UPDATE users SET verified = TRUE, verification_token = NULL, verification_token_expires_at = NULL WHERE user_id = $1", [userId]);

        response.status(200).json({ message: "Email verified successfully, you can log in now." });
    } catch (error) {
        console.error("Error verifying email:", error);
        response.status(500).json({ message: "Internal server error" });
    }
}

export const resendVerificationEmailHandler = async (request: Request, response: Response): Promise<void> => {
    const { email, username } = request.body;
    if (!email || typeof email !== 'string' || email.trim() === '') {
        response.status(400).json({ message: "Invalid email address" });
        return;
    }
    if (!username || typeof username !== 'string' || username.trim() === '') {
        response.status(400).json({ message: "Invalid username" });
        return;
    }

    try {
        // Find user with the provided email who is not yet verified
        const result = await pool.query("SELECT user_id FROM users WHERE email = $1 AND verified = $2", [email, false]);

        if (result.rows.length === 0) {
            response.status(400).json({ message: "No unverified account found with that email" });
            return;
        }

        const userId = result.rows[0].user_id;

        // Generate a new verification token
        const verificationToken = crypto.randomBytes(3).toString("hex");
        // Set token to expire in 15 minutes
        const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Update the user's verification token in the database
        await pool.query("UPDATE users SET verification_token = $1, verification_token_expires_at = $2 WHERE user_id = $3", 
            [verificationToken, verificationTokenExpiresAt, userId]);

        // Send the new verification email
        await sendVerificationEmail(username, email, verificationToken);

        response.status(200).json({ message: "Verification email resent. Please check your email." });
    } catch (error) {
        console.error("Error resending verification email:", error);
        response.status(500).json({ message: "Internal server error" });
    }
}