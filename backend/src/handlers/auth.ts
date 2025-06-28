import { Request, Response } from "express-serve-static-core";
import pool from '../db'
import { SignupDto } from "../dtos/Signup.dto";
import { genPassword } from "../lib/passwordUtils";

export async function postSignup(request: Request<{},{}, SignupDto>, response: Response): Promise<void>{
    // TODO: Implement signup logic
    try {
        const { firstName, lastName, email, password } = request.body;
        if (!firstName || !lastName || !email || !password) {
            response.status(400).json({ error: "Missing required fields" });
            return
        }
        const saltHash = genPassword(password);
        const salt = saltHash.salt;
        const hash = saltHash.hash;
        await pool.query("INSERT INTO users (email, password_hash, salt, first_name, last_name) VALUES ($1, $2, $3, $4, $5)",
            [email, hash, salt, firstName, lastName]
        );
        response.status(201).json({ message: "Signup successful"});
        return;
    } catch (error:any) {
        // Postgres unique_violation error code is 23505
        if (error.code === '23505') {
            response.status(409).json({ error: "Email already exists" });
            return;
        }
        console.error(error);
        response.status(500).json({ error: "Signup failed" });
        return;
    }
}