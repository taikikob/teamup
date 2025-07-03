import { Request, Response } from "express-serve-static-core";
import pool from '../db'

interface CreateTeamDto {
    team_name: string;
}

export async function postCreate(request: Request<{},{}, CreateTeamDto>, response: Response): Promise<void> {
    try {
        const { team_name } = request.body;
        const user = request.user;
        if (!user) {
            response.status(401).json({ error: 'User not authenticated' });
            return;
        }
        // TODO: IMPLEMENT MAKING NEW TEAMS IN THE DATABASE
    } catch (error) {
        console.error('Error creating team:', error);
        response.status(500).json({ error: 'Failed to create team. Please try again.' });
        return;
    }
}