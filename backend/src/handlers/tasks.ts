import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";
import { sendNotificationEmail } from "../nodeMailer";

export const getTaskStatus = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;

    try {
        const submissionCheck = await pool.query(
            `SELECT 1 FROM task_submissions WHERE task_id = $1 AND player_id = $2`,
            [taskId, user.user_id]
        );
        const completionCheck = await pool.query(
            `SELECT 1 FROM task_completions WHERE task_id = $1 AND player_id = $2`,
            [taskId, user.user_id]
        );

        res.status(200).json({ 
            hasSubmitted: Boolean(submissionCheck?.rowCount && submissionCheck.rowCount > 0),
            hasCompleted: Boolean(completionCheck?.rowCount && completionCheck.rowCount > 0)
        });
    } catch (error) {
        console.error("Error fetching task status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const postTaskSubmit = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;

    try {
        // use transaction to ensure atomicity
        const client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query(
            `INSERT INTO task_submissions (task_id, player_id) VALUES ($1, $2) returning submitted_at`,
            [taskId, user.user_id]
        );
        // add notification to all coaches in the team
        const teamIdResult = await client.query(
            `SELECT team_id FROM mastery_tasks WHERE task_id = $1`,
            [taskId]
        );
        const team_id = teamIdResult.rows[0]?.team_id;
        if (!team_id) {
            throw new Error("Team not found for the given task");
        }
        const node_id_result = await client.query(
            `SELECT node_id FROM mastery_tasks WHERE task_id = $1`,
            [taskId]
        );
        const node_id = node_id_result.rows[0]?.node_id;
        if (!node_id) {
            throw new Error("Node not found for the given task");
        }
        const coachesIdsResult = await client.query(
            `SELECT user_id FROM team_memberships 
            WHERE team_id = $1 AND role = $2`,
            [team_id, 'Coach']
        );
        // get player name
        const playerNameResult = await client.query(
            `SELECT first_name, last_name FROM users WHERE user_id = $1`,
            [user.user_id]
        );
        const playerName = `${playerNameResult.rows[0].first_name} ${playerNameResult.rows[0].last_name}`;
        // loop through each coachID and add a notification
        for (const coach of coachesIdsResult.rows) {
            await client.query(
                `INSERT INTO notifications (user_id, type, sent_from_id, content, team_id, node_id, task_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [coach.user_id, 'player_submitted', user.user_id, `Player ${playerName} has submitted a task!`, team_id, node_id, taskId]
            );
        }
        await client.query("COMMIT");
        client.release();
        res.status(201).json({
            message: "Task submitted successfully",
            submittedAt: result.rows[0].submitted_at 
        });
        return;
    } catch (error) {
        console.error("Error submitting task:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}

export const postTaskComplete = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_id, taskId } = req.params;
    if (!team_id || !taskId) {
        res.status(400).json({ message: "Team ID and Task ID are required" });
        return;
    }
    const { player_id } = req.body;

    if (!player_id) {
        res.status(400).json({ message: "Player ID is required" });
        return;
    }
    // use transaction to ensure atomicity
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // access database, add row to task_completions table
        await client.query(
            `INSERT INTO task_completions (task_id, player_id) VALUES ($1, $2)`,
            [taskId, player_id]
        );
        // add row to notifications table
        const node_id = (await client.query(
            `SELECT node_id FROM mastery_tasks WHERE task_id = $1`,
            [taskId]
        )).rows[0].node_id;

        await client.query(
            `INSERT INTO notifications (user_id, sent_from_id, type, content, team_id, node_id, task_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [player_id, user.user_id, 'task_completed', `Coach has approved your submission!`, team_id, node_id, taskId]
        );

        await client.query("COMMIT");
        client.release();
        // send response
        res.status(201).json({ message: "Task marked as complete successfully" });
        return;
    } catch (error) {
        console.error("Error marking task as complete:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}

export const postTaskUnapprove = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_id, taskId } = req.params;
    if (!team_id || !taskId) {
        res.status(400).json({ message: "Team ID and Task ID are required" });
        return;
    }
    const { player_id } = req.body;

    if (!player_id) {
        res.status(400).json({ message: "Player ID is required" });
        return;
    }

    try {
        // use transaction to ensure atomicity
        const client = await pool.connect();
        await client.query("BEGIN");
        
        // delete row from task_submissions table
        await client.query(
            `DELETE FROM task_submissions WHERE task_id = $1 AND player_id = $2`,
            [taskId, player_id]
        );

        await client.query(
            `DELETE FROM task_completions WHERE task_id = $1 AND player_id = $2`,
            [taskId, player_id]
        );

        const node_id = (await client.query(
            `SELECT node_id FROM mastery_tasks WHERE task_id = $1`,
            [taskId]
        )).rows[0].node_id;

        // add row to notifications table
        await client.query(
            `INSERT INTO notifications (user_id, sent_from_id, type, content, team_id, node_id, task_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [player_id, user.user_id, 'task_unapproved', `Coach has unapproved your submission, try again!`, team_id, node_id, taskId]
        );

        await client.query("COMMIT");
        client.release();

        res.status(200).json({ message: "Task unapproved successfully" });
    } catch (error) {
        console.error("Error unapproving task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const deleteTaskSubmit = async (req: Request, res: Response) => {
    const user = req.user as User;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM task_submissions WHERE task_id = $1 AND player_id = $2`,
            [taskId, user.user_id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ message: "Submission not found" });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting task submission:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

