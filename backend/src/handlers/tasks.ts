import { Request, Response } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";

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
        const result = await pool.query(
            `INSERT INTO task_submissions (task_id, player_id) VALUES ($1, $2) returning submitted_at`,
            [taskId, user.user_id]
        );
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
    const { taskId } = req.params;
    const { player_id } = req.body;

    if (!taskId || !player_id) {
        res.status(400).json({ message: "Task ID and Player ID are required" });
        return;
    }
    try {
        // access database, add row to task_completions table
        await pool.query(
            `INSERT INTO task_completions (task_id, player_id) VALUES ($1, $2)`,
            [taskId, player_id]
        );
        res.status(201).json({ message: "Task marked as complete successfully" });
        return;
    } catch (error) {
        console.error("Error marking task as complete:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
}

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

