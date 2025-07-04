import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { genAccCode } from "../lib/accessCodeUtils";
import { User } from "../types/User";

export async function getTeams(request: Request, response: Response) {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    try {
        const result = await pool.query(
            `SELECT tm.team_id, t.team_name, tm.role
            FROM team_memberships tm
            JOIN teams t ON tm.team_id = t.team_id
            WHERE tm.user_id = $1`,
            [user.user_id]
        );
        console.log(result.rows);
        response.status(200).json(result.rows);
        return;
    } catch (error) {
        console.error('Error fetching teams that user is a part of:', error);
        response.status(500).json({ error: 'Failed to fetch teams user is a part of please try again.' });
    }
}



interface CreateTeamDto {
    team_name: string;
}

export async function postCreate(request: Request<{},{}, CreateTeamDto>, response: Response): Promise<void> {
    
    const { team_name } = request.body;
    if (!team_name) {
        response.status(400).json({error: "Missing required fields"});
        return;
    }
    if (team_name.trim().length === 0) {
        response.status(400).json({ error: "Team name must be at least 1 character." });
        return;
    }
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const client = await pool.connect();
    try {
        // keep database queries as a transaction so if anything fails the database is not modified
        await client.query('BEGIN');

        // Insert into teams table
        const result = await client.query("INSERT INTO teams (team_name) VALUES ($1) RETURNING team_id",
            [team_name]
        );

        const team_id = result.rows[0].team_id;
        // Create new membership, the user that sent this request is the coach
        await client.query("INSERT INTO team_memberships (team_id, user_id, role) VALUES ($1, $2, $3)",
            [team_id, user.user_id, 'coach']
        );

        // Create new coach access code for team to be able to add more coaches
        let coachCode;
        let exists = true;
        while (exists) {
            coachCode = genAccCode();
            const res = await client.query('SELECT 1 FROM access_codes WHERE code = $1', [coachCode]);
            exists = res.rowCount! > 0;
        }
        // add new coach access code to table
        let playerCode;
        exists = true;
        while (exists) {
            playerCode = genAccCode();
            const res = await client.query('SELECT 1 FROM access_codes WHERE code = $1', [playerCode]);
            exists = res.rowCount! > 0 || playerCode === coachCode;
        }
        // insert both codes into table
        const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days later
        await client.query(
            `INSERT INTO access_codes (team_id, code, role, expires_at)
            VALUES 
                ($1, $2, 'coach', $3),
                ($1, $4, 'player', $3)`,
            [team_id, coachCode, expires_at, playerCode]
        );
        await client.query('COMMIT');
        response.status(201).json({
            msg: "Team Created Successfully"
        })
    } catch (error) {
        console.error('Error creating team:', error);
        response.status(500).json({ error: 'Failed to create team. Please try again.' });
        return;
    } finally {
       client.release(); 
    }
}