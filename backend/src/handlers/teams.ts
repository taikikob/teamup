import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { genAccCode } from "../lib/accessCodeUtils";
import { User } from "../types/User";

export async function getTeams(request: Request, response: Response): Promise<void> {
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

export async function getTeamInfo(request:Request, response:Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    try {
        const team_id = request.params.team_id;
        const result = await pool.query(
            `SELECT t.team_id, t.team_name, t.team_description, 
                EXISTS(
                    SELECT 1 FROM team_memberships tm 
                        WHERE tm.team_id = $1
                        AND tm.user_id = $2
                        AND tm.role = 'Coach'
                ) AS is_user_coach,
                (
                    SELECT
                        COALESCE(
                            json_agg(
                                json_build_object(
                                    'user_id', u_coach.user_id,
                                    'first_name', u_coach.first_name,
                                    'last_name', u_coach.last_name,
                                    'email', u_coach.email
                                )
                            ) FILTER (WHERE u_coach.user_id IS NOT NULL),
                            '[]'::json -- Keep this COALESCE for coaches, as a team might genuinely have no coaches
                        )
                    FROM team_memberships tm_coach
                    JOIN users u_coach ON tm_coach.user_id = u_coach.user_id
                    WHERE tm_coach.team_id = t.team_id AND tm_coach.role = 'Coach'
                ) AS coaches_info,
                (
                    SELECT 
                        json_agg(
                            json_build_object (
                                'code', ac.code,
                                'role', ac.role,
                                'expires_at', ac.expires_at
                            )
                        )
                    FROM access_codes ac
                    WHERE ac.team_id = $1
                ) AS team_access_codes
            FROM teams t
            WHERE t.team_id = $1`,
        [team_id, user.user_id]);
        console.log(result.rows[0]);
        response.status(200).json(result.rows[0]);
        return;
    } catch (error) {
        console.error('Error fetching team information:', error);
        response.status(500).json({ error: 'Failed to fetch the information for this team.' });
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
            [team_id, user.user_id, 'Coach']
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
                ($1, $2, 'Coach', $3),
                ($1, $4, 'Player', $3)`,
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

interface CreateTeamDto {
    team_id: number;
    team_description: string;
}

export async function editDescription(request: Request, response: Response): Promise<void> {
    const { team_description } = request.body; // Destructure directly from req.body
    // validate team_description
    if (typeof team_description === 'undefined' || team_description === null) {
        // Decide if null is allowed. If not, make it a 400.
        // If it can be set to null, then only check for undefined.
        response.status(400).json({ message: 'Team description is required in the request body.' });
        return;
    }
    if (typeof team_description !== 'string') {
        response.status(400).json({ message: 'Team description must be a string.' });
        return;
    }
    // TODO: Limit number of characters for description in frontend
    try {
        // already validated teamId
        const teamId = parseInt(request.params.team_id || '', 10);
        pool.query(
            `UPDATE teams 
             SET team_description = $1
             WHERE team_id = $2`,
            [team_description, teamId]
        );
        response.status(200).json({ message: 'Team description updated successfully.' });
        return;
    } catch (error) {
        console.error('Database update error for team description:', error);
        response.status(500).json({ message: 'Internal server error updating team description.' });
        return;
    }
};