import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { genAccCode } from "../lib/accessCodeUtils";
import { User } from "../types/User";
import { deleteFile } from "../lib/s3utils";
import { invalidateCache } from "../lib/cloudFrontUtils";
import { getProfilePictureUrl } from "../lib/profilePictUtil";
import { deleteTeamHelper } from "../lib/deleteTeamHelper";
import { addNotificationToTeam } from "../lib/notificationHelpers";

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
        const teamResult = await pool.query(
            `SELECT team_id, team_name, team_description 
             FROM teams 
             WHERE team_id = $1`,
            [team_id]
        );

        if (teamResult.rows.length === 0) {
            response.status(404).json({ error: 'Team not found' });
            return;
        }

        const team = teamResult.rows[0];

        // Query 2: Check if current user is a coach of this team
        const coachCheckResult = await pool.query(
            `SELECT 1 FROM team_memberships 
             WHERE team_id = $1 AND user_id = $2 AND role = 'Coach'`,
            [team_id, user.user_id]
        );

        const is_user_coach = coachCheckResult.rows.length > 0;

        // Query 3: Get all coaches for this team
        const coachesResult = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email
             FROM team_memberships tm
             JOIN users u ON tm.user_id = u.user_id
             WHERE tm.team_id = $1 AND tm.role = 'Coach'
             ORDER BY u.first_name, u.last_name`,
            [team_id]
        );

        // loop through all coaches, and add their profile picture link
        for (const coach of coachesResult.rows) {
            coach.profile_picture_link = await getProfilePictureUrl(coach.user_id);
        }

        const coaches_info = coachesResult.rows;

        // Query 4: Get all players for this team
        const playersResult = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email
             FROM team_memberships tm
             JOIN users u ON tm.user_id = u.user_id
             WHERE tm.team_id = $1 AND tm.role = 'Player'
             ORDER BY u.first_name, u.last_name`,
            [team_id]
        );

        // loop through all players, and add their profile picture link
        for (const player of playersResult.rows) {
            player.profile_picture_link = await getProfilePictureUrl(player.user_id);
        }

        const players_info = playersResult.rows;

        // Query 5: Get access codes for this team
        const accessCodesResult = await pool.query(
            `SELECT code, role, expires_at
             FROM access_codes
             WHERE team_id = $1
             ORDER BY expires_at DESC`,
            [team_id]
        );

        const team_access_codes = accessCodesResult.rows;

        // Combine all the data
        const teamData = {
            ...team,
            is_user_coach,
            coaches_info,
            players_info,
            team_access_codes
        };

        console.log(teamData);
        response.status(200).json(teamData);
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

        // Fetch edges from the team
        const edgesRes = await client.query("SELECT edge_id, source_node_id, target_node_id FROM mastery_edges WHERE team_id = $1", [team_id]);
        // Transform edges to React Flow format
        const edges = edgesRes.rows.map(e => ({
            id: e.edge_id,
            source: e.source_node_id,
            target: e.target_node_id,
            type: 'custom'
        }));

        const role = request.query.role as 'coach' | 'player';
        // Fetch nodes from the team
        const nodesRes = await client.query("SELECT node_id, label, pos_x, pos_y FROM mastery_nodes WHERE team_id = $1", [team_id]);
        // Transform nodes to React Flow format
        if (role === 'coach') {
            const nodes = nodesRes.rows.map(n => ({
                id: n.node_id,
                position: { x: n.pos_x, y: n.pos_y },
                data: { label: n.label },
                type: 'custom'
            }));
            await client.query('COMMIT');
            response.status(200).json({
                msg: "Flow data fetched successfully",
                nodes,
                edges
            });
        } else {
            // For players, we also need to fetch the number of tasks completed for each node
            // and the total number of tasks for each node
            const nodes = [];
            for (const n of nodesRes.rows) {
                // Total tasks for this node
                const totalTasksRes = await client.query(
                    "SELECT COUNT(*) FROM mastery_tasks WHERE team_id = $1 AND node_id = $2",
                    [team_id, n.node_id]
                );
                const total_tasks = parseInt(totalTasksRes.rows[0].count, 10);

                // Completed tasks for this node for this player
                const completedTasksRes = await client.query(
                    `SELECT COUNT(*) FROM task_completions tc
                    JOIN mastery_tasks mt ON tc.task_id = mt.task_id
                    WHERE mt.team_id = $1 AND mt.node_id = $2 AND tc.player_id = $3`,
                    [team_id, n.node_id, user.user_id]
                );
                const completed_tasks = parseInt(completedTasksRes.rows[0].count, 10);

                nodes.push({
                    id: n.node_id,
                    position: { x: n.pos_x, y: n.pos_y },
                    data: {
                        label: n.label,
                        completed_tasks,
                        total_tasks
                    },
                    type: 'custom'
                });
            }
            await client.query('COMMIT');
            response.status(200).json({
                msg: "Flow data fetched successfully",
                nodes,
                edges
            });
        }
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
        SELECT 
            t.task_id, 
            t.title, 
            t.task_order,
            CASE WHEN c.task_id IS NOT NULL THEN true ELSE false END AS completed
        FROM mastery_tasks t
        LEFT JOIN task_completions c
            ON t.task_id = c.task_id AND c.player_id = $3
        WHERE t.team_id = $1 AND t.node_id = $2
        ORDER BY t.task_order
        `, [team_id, node_id, user.user_id]);
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

export async function changeTeamName (request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_name } = request.body;
    const team_id = request.params.team_id;
    if (!team_name || typeof team_name !== 'string') {
        response.status(400).json({ error: 'Missing or invalid team_name.' });
        return;
    }
    if (team_name.trim().length === 0) {
        response.status(400).json({ error: 'Team name must be at least 1 character.' });
        return;
    }
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE teams SET team_name = $1 WHERE team_id = $2',
            [team_name, team_id]
        );
        response.status(200).json({ message: 'Team name updated successfully.' });
    } catch (error) {
        console.error('Error updating team name:', error);
        response.status(500).json({ error: 'Failed to update team name.' });
    } finally {
        client.release();
    }
}

export async function updateTaskOrder(request: Request, response: Response): Promise<void> {
    const { team_id, node_id } = request.params;
    const { tasks } = request.body; // [{task_id, task_order}, ...]
    const client = await pool.connect();

    if (!Array.isArray(tasks) || tasks.length === 0) {
        response.status(400).json({ error: 'No tasks provided.' });
        return;
    }

    try {
        await client.query('BEGIN');
        for (const { task_id, task_order } of tasks) {
            await client.query(
                'UPDATE mastery_tasks SET task_order = $1 WHERE team_id = $2 AND node_id = $3 AND task_id = $4',
                [task_order, team_id, node_id, task_id]
            );
        }
        await client.query('COMMIT');
        response.status(200).json({ message: 'Task order updated.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in updateTaskOrder:', err);
        response.status(500).json({ error: 'Failed to update task order.' });
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

export async function deleteTeam(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const team_id = request.params.team_id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transaction
        await deleteTeamHelper(team_id, client);
        // Notify all team members that the team has been deleted
        await addNotificationToTeam(team_id, 'team_deleted', user.user_id, `The team has been deleted.`);
        await client.query('COMMIT'); // Commit transaction
        response.status(204).send(); // No content to return
    } catch (error) {
        console.error('Error deleting team:', error);
        await client.query('ROLLBACK'); // Rollback transaction on error
        response.status(500).json({ error: 'Failed to delete team. Please try again.' });
    } finally {
        client.release(); // Release the client back to the pool
    }
}

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

export async function deleteTask(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_id, node_id, task_id } = request.params;
    const client = await pool.connect();
    try {
        await client.query(
            'DELETE FROM mastery_tasks WHERE team_id = $1 AND node_id = $2 AND task_id = $3',
            [team_id, node_id, task_id]
        );
        response.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        response.status(500).json({ error: 'Failed to delete task. Please try again.' });
    } finally {
        client.release();
    }
}

export async function handleLeaveTeam(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const team_id = request.params.team_id;
    const client = await pool.connect();
    let teamDeleted = false;
    
    try {
        await client.query('BEGIN'); // Start transaction

        // check if user is a coach of this team
        const coachCheckResult = await client.query(
            `SELECT 1 FROM team_memberships 
             WHERE team_id = $1 AND user_id = $2 AND role = $3
            `, [team_id, user.user_id, 'Coach']
        );
        
        if (coachCheckResult.rows.length > 0) {
            // User is a coach, don't need to delete their related resources/comments
            // remove coach from team_memberships
            console.log('User is a coach, removing from team memberships');
            await client.query(`
                DELETE FROM team_memberships
                WHERE user_id = $1 AND team_id = $2
            `, [user.user_id, team_id]);
            
            // if there are no more coaches left in the team, delete the team
            const remainingCoachesRes = await client.query(`
                SELECT 1 FROM team_memberships
                WHERE team_id = $1 AND role = 'Coach'
            `, [team_id]);
            
            console.log('Remaining coaches:', remainingCoachesRes.rows);
            if (remainingCoachesRes.rows.length === 0) {
                // no more coaches, delete the team and all related resources
                // fetch team name to include in notification
                const teamNameRes = await client.query(`
                    SELECT team_name FROM teams WHERE team_id = $1
                `, [team_id]);
                const teamName = teamNameRes.rows[0]?.team_name;
                if (!teamName) {
                    throw new Error('Team not found');
                }
                await deleteTeamHelper(team_id, client);
                await addNotificationToTeam(team_id, 'team_deleted', user.user_id, `${teamName} has been deleted.`);
                teamDeleted = true;
            }
        } else {
            // user is a player, delete their related resources on s3 and invalidate cloudFront cache
            // select all posts related to this player for this team
            const playerPostsInTeam = await client.query(`
                SELECT media_name FROM posts 
                WHERE user_id = $1 
                  AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
            `, [user.user_id, team_id]);
            
            // Delete posts from S3 and invalidate CloudFront cache
            for (const post of playerPostsInTeam.rows) {
                const mediaName = post.media_name;
                await deleteFile(mediaName);
                await invalidateCache(mediaName);
            }
            
            // delete all posts related to this player for this team
            await client.query(`
                DELETE FROM posts
                WHERE user_id = $1 
                  AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
            `, [user.user_id, team_id]);
            
            // delete all submissions related to this
            await client.query(`
                DELETE FROM task_submissions
                WHERE player_id = $1
                AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
            `, [user.user_id, team_id]);
            
            await client.query(`
                DELETE FROM task_completions
                WHERE player_id = $1
                AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
            `, [user.user_id, team_id]);
            
            await client.query(`
                DELETE FROM comments
                WHERE player_id = $1
                AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
            `, [user.user_id, team_id]);
            
            // delete the membership
            await client.query(`
                DELETE FROM team_memberships
                WHERE user_id = $1 AND team_id = $2
            `, [user.user_id, team_id]);
        }

        await client.query('COMMIT'); // Commit transaction
        
        // Return different responses based on what happened
        if (teamDeleted) {
            console.log('Team deleted successfully as the last coach left.');
            response.status(200).json({ 
                message: 'Team deleted successfully as you were the last coach.', 
                teamDeleted: true 
            });
        } else {
            response.status(200).json({ 
                message: 'Left team successfully.', 
                teamDeleted: false 
            });
        }
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error handling leave team:', error);
        response.status(500).json({ error: 'Failed to leave team. Please try again.' });
    } finally {
        client.release();
    }
}

export async function deletePlayer(request: Request, response: Response): Promise<void> {
    const user = request.user as User;
    if (!user) {
        response.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const team_id = request.params.team_id;
    const player_id = request.params.player_id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`
            DELETE FROM task_submissions
            WHERE player_id = $1
              AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
        `, [player_id, team_id]);
        await client.query(`
            DELETE FROM task_completions
            WHERE player_id = $1
              AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
        `, [player_id, team_id]);
        await client.query(`
            DELETE FROM comments
            WHERE player_id = $1
              AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
        `, [player_id, team_id]);
        // Need to delete posts related to this player for this team from s3 and invalidate cloudFront cache 
        const playerPostsInTeam = await client.query(`
            SELECT media_name FROM posts 
            WHERE user_id = $1 
              AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
              AND media_type = $3
        `, [player_id, team_id, 'player_submission']);
        // Delete posts from S3 and invalidate CloudFront cache
        for (const post of playerPostsInTeam.rows) {
            const mediaName = post.media_name;
            await deleteFile(mediaName);
            await invalidateCache(mediaName);
        }
        await client.query(`
            DELETE FROM posts
            WHERE user_id = $1
              AND task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $2)
        `, [player_id, team_id]);
        await client.query(`
            DELETE FROM team_memberships
            WHERE user_id = $1 AND team_id = $2
        `, [player_id, team_id]);
        // create notification for the player that they have been removed from the team
        // get team name
        const teamNameRes = await client.query(`
            SELECT team_name FROM teams WHERE team_id = $1
        `, [team_id]);
        const teamName = teamNameRes.rows[0]?.team_name;
        if (!teamName) {
            throw new Error('Team not found');
        }
        await client.query(`
            INSERT INTO notifications (user_id, type, sent_from_id, content)
            VALUES ($1, $2, $3, $4)
        `, [player_id, 'player_removed', user.user_id, `You have been removed from ${teamName}.`]);
        await client.query('COMMIT');
        response.status(200).json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing player and related data:', error);
        response.status(500).json({ error: 'Failed to remove player and related data.' });
    } finally {
        client.release();
    }
}