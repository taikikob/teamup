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

export async function getTeamFlow(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const team_id = request.params.team_id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch nodes from the team
        const nodesRes = await client.query("SELECT node_id, label, pos_x, pos_y FROM mastery_nodes WHERE team_id = $1", [team_id]);
        // Transform nodes to React Flow format
        const nodes = nodesRes.rows.map(n => ({
            id: n.node_id,
            position: { x: n.pos_x, y: n.pos_y },
            data: { label: n.label },
            type: 'custom'
        }));

        // Fetch edges from the team
        const edgesRes = await client.query("SELECT edge_id, source_node_id, target_node_id FROM mastery_edges WHERE team_id = $1", [team_id]);
        // Transform edges to React Flow format
        const edges = edgesRes.rows.map(e => ({
            id: e.edge_id,
            source: e.source_node_id,
            target: e.target_node_id,
            type: 'custom'
        }));

        await client.query('COMMIT');
        response.status(200).json({
            msg: "Flow data fetched successfully",
            nodes,
            edges
        });
        console.log(nodes, edges);
    } catch (error) {
        console.error('Error fetching flow data:', error);
        response.status(500).json({ error: 'Failed to fetch flow data. Please try again.' });
        return;
    } finally {
       client.release(); 
    }
}

export async function getNodeTasks(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_id, node_id } = request.params;
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT task_id, title, task_order
            FROM mastery_tasks
            WHERE team_id = $1 AND node_id = $2
        `, [team_id, node_id]);
        response.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching node tasks:', error);
        response.status(500).json({ error: 'Failed to fetch node tasks. Please try again.' });
    } finally {
        client.release();
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

export async function postJoin(request: Request, response:Response): Promise<void> {
    const { input_code_raw } = request.body;

    if (typeof input_code_raw !== 'string' || input_code_raw.trim() === '') {
        // Send an error response back to the client
        response.status(400).json({ message: 'input_code_raw is required and must be a non-empty string.' });
        return;
    }

    const input_code_trimmed = input_code_raw.trim();
    const input_code = input_code_trimmed.toUpperCase();

    if (typeof input_code !== 'string') {
        response.status(400).json({ message: 'Input code must be a string.' });
        return;
    }
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    try {
        const response1 = await pool.query(
            `SELECT ac.code, ac.role, ac.expires_at, ac.team_id
             FROM access_codes ac
             WHERE ac.code = $1`,
            [input_code]
        )
        
        if (response1.rows.length > 0) {
            // user provided valid code
            // check if user already in team
            const response2 = await pool.query(
                `SELECT 
                 EXISTS(
                    SELECT 1 FROM team_memberships tm
                    WHERE tm.team_id = $1
                    AND tm.user_id = $2
                 ) AS user_in_team`,
                [response1.rows[0].team_id, user.user_id]
            );
            if (response2.rows[0].user_in_team) {
                // user already exists in the team so send error message
                response.status(409).json({message: 'You are already a part of the team you attempted to join.'});
                return;
            }
            // add to membership table
            const accessCodeData = response1.rows[0];
            const expiryDate = new Date(accessCodeData.expires_at);
            const now = new Date(); // current time
            if (now > expiryDate) {
                response.status(400).json({message: 'Your code is expired, ask your coach to generate a new code'});
                return;
            }
            await pool.query(
                `INSERT INTO team_memberships (team_id, user_id, role)
                 VALUES ($1, $2, $3)`,
                [accessCodeData.team_id, user.user_id, accessCodeData.role]
            )
            response.status(201).json({ message: 'You successfully joined a team' });
        } else {
            // send error message saying code is invalid
            response.status(400).json({message: 'Invalid code, make sure it is correct'});
        }
    } catch (error) {
        console.error('Database query error to look for code:', error);
        response.status(500).json({ message: 'Internal server error when joining team.' });
        return;
    }
}

export async function newAC(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const client = await pool.connect();
    try {
        const team_id = request.params.team_id;
        await client.query('BEGIN');
        // delete old access code for this team
        // if no old access codes exist, this query will have no effect
        await client.query(`DELETE FROM access_codes WHERE team_id = $1`, [team_id]);
        // create new access codes for this team
        let coachCode;
        let exists = true;
        while (exists) {
            coachCode = genAccCode();
            const res = await client.query('SELECT 1 FROM access_codes WHERE code = $1', [coachCode]);
            exists = res.rowCount! > 0;
        }
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
            message: "New Access Codes Created"
        })
    } catch (error) {
        console.error('Failed to generate new access codes:', error);
        response.status(500).json({ error: 'Failed to generate new access codes. Please try again.' });
        return;
    } finally {
       client.release(); 
    }
}

export async function postFlow(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { nodes, edges } = request.body;
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        response.status(400).json({ error: 'Invalid data format. Nodes and edges must be arrays.' });
        return;
    }
    const team_id = request.params.team_id;
    const client = await pool.connect();
    try {
        // keep database queries as a transaction so if anything fails the database is not modified
        await client.query('BEGIN');
        
        // 1. Fetch existing node IDs for the team
        const existingNodesRes = await client.query('SELECT node_id FROM mastery_nodes WHERE team_id = $1', [team_id]);
        const existingNodeIds = existingNodesRes.rows.map(row => row.node_id);

        // 2. Get new node IDs from the request
        const newNodeIds = nodes.map(node => String(node.id));

        // 3. Find nodes to delete
        const nodesToDelete = existingNodeIds.filter(id => !newNodeIds.includes(id));

        // 4. Delete only those nodes (and their edges/tasks)
        for (const nodeId of nodesToDelete) {
            await client.query('DELETE FROM mastery_nodes WHERE team_id = $1 AND node_id = $2', [team_id, nodeId]);
            // Edges and tasks will cascade delete if foreign keys are set up
        }

        // 5. Upsert nodes
        for (const node of nodes) {
            const node_id = String(node.id);
            const label = node.data.label;
            const pos_x = node.position.x;
            const pos_y = node.position.y;

            // Try to update first
            const updateRes = await client.query(
                'UPDATE mastery_nodes SET label = $1, pos_x = $2, pos_y = $3 WHERE team_id = $4 AND node_id = $5',
                [label, pos_x, pos_y, team_id, node_id]
            );

            // If no rows were updated, insert
            if (updateRes.rowCount === 0) {
                await client.query(
                    'INSERT INTO mastery_nodes (team_id, node_id, label, pos_x, pos_y) VALUES ($1, $2, $3, $4, $5)',
                    [team_id, node_id, label, pos_x, pos_y]
                );
            }
        }

        // Delete all edges for the team (edges are not linked to tasks, so safe to delete all)
        await client.query('DELETE FROM mastery_edges WHERE team_id = $1', [team_id]);

        // Insert new edges
        for (const edge of edges) {
            const edge_id = String(edge.id);
            const source = String(edge.source);
            const target = String(edge.target);
            await client.query(
                'INSERT INTO mastery_edges (team_id, edge_id, source_node_id, target_node_id) VALUES ($1, $2, $3, $4)',
                [team_id, edge_id, source, target]
            );
        }

        await client.query('COMMIT');
        response.status(200).json({ message: 'Flow data saved successfully.' });
    } catch (error) {
        console.error('Error saving flow data:', error);
        response.status(500).json({ error: 'Failed to save flow data. Please try again.' });
        return;
    } finally {
        client.release();
    }
}

export async function postCreateTask(req: Request, res: Response): Promise<void> {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_id, node_id } = req.params;
    const { input_title, task_order } = req.body;

    if (!input_title || typeof task_order !== 'number') {
        res.status(400).json({ message: 'Missing required fields.' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO mastery_tasks (node_id, team_id, title, task_order)
             VALUES ($1, $2, $3, $4)`,
            [node_id, team_id, input_title, task_order]
        );
        res.status(201).json({ message: 'Task created successfully.' });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Failed to create task.' });
    } finally {
        client.release();
    }
}

export async function updateNodeLabel(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { node_id, label } = request.body;
    console.log('Updating node label:', { node_id, label });
    const team_id = request.params.team_id;
    if (!node_id || typeof label !== 'string') {
        response.status(400).json({ error: 'Missing node_id or label.' });
        return;
    }
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE mastery_nodes SET label = $1 WHERE team_id = $2 AND node_id = $3',
            [label, team_id, node_id]
        );
        response.status(200).json({ message: 'Node label updated successfully.' });
    } catch (error) {
        console.error('Error updating node label:', error);
        response.status(500).json({ error: 'Failed to update node label.' });
    } finally {
        client.release();
    }
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
        // already validated teamId, and that the user that sent this request is a coach
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

export async function deleteAC(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    try {
        const team_id = request.params.team_id;
        // if no old access codes exist, this query will have no effect
        await pool.query(`DELETE FROM access_codes WHERE team_id = $1`, [team_id]);
        response.status(204).send();
    } catch (error) {
        console.error('Failed to delete access codes:', error);
        response.status(500).json({ error: 'Failed to delete existing access codes. Please try again.' });
        return;
    }
}