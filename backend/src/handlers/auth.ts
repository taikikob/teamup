import { Request, Response } from "express-serve-static-core";
import pool from '../db'
import { SignupDto } from "../dtos/Signup.dto";
import { genPassword } from "../lib/passwordUtils";

export async function postSignup(request: Request<{},{}, SignupDto>, response: Response): Promise<void>{
    try {
        const { firstName, lastName, username, password } = request.body;
        if (!firstName || !lastName || !username || !password) {
            response.status(400).json({ error: "Missing required fields" });
            return
        }
        const saltHash = genPassword(password);
        const salt = saltHash.salt;
        const hash = saltHash.hash;
        await pool.query("INSERT INTO users (username, password_hash, salt, first_name, last_name) VALUES ($1, $2, $3, $4, $5)",
            [username, hash, salt, firstName, lastName]
        );
        response.status(201).json({ message: "Signup successful. Please log in now."});
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
        const result = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
        const isUnique = result.rows.length === 0;
        response.json({ isUnique });
    } catch (error) {
        console.error("Database error during username uniqueness check:", error);
        response.status(500).json({ isUnique: false, error: "Internal Server Error" });
    }
}