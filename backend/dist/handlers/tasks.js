"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskSubmit = exports.editDescription = exports.postTaskUnapprove = exports.postTaskComplete = exports.postTaskSubmit = exports.getTaskStatus = void 0;
const db_1 = __importDefault(require("../db"));
const getTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;
    try {
        const submissionCheck = yield db_1.default.query(`SELECT 1 FROM task_submissions WHERE task_id = $1 AND player_id = $2`, [taskId, user.user_id]);
        const completionCheck = yield db_1.default.query(`SELECT 1 FROM task_completions WHERE task_id = $1 AND player_id = $2`, [taskId, user.user_id]);
        const submittedAt = yield db_1.default.query(`SELECT submitted_at FROM task_submissions WHERE task_id = $1 AND player_id = $2`, [taskId, user.user_id]);
        res.status(200).json({
            hasSubmitted: Boolean((submissionCheck === null || submissionCheck === void 0 ? void 0 : submissionCheck.rowCount) && submissionCheck.rowCount > 0),
            hasCompleted: Boolean((completionCheck === null || completionCheck === void 0 ? void 0 : completionCheck.rowCount) && completionCheck.rowCount > 0),
            submittedAt: ((_a = submittedAt.rows[0]) === null || _a === void 0 ? void 0 : _a.submitted_at) || null
        });
    }
    catch (error) {
        console.error("Error fetching task status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getTaskStatus = getTaskStatus;
const postTaskSubmit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;
    try {
        // use transaction to ensure atomicity
        const client = yield db_1.default.connect();
        yield client.query("BEGIN");
        const result = yield client.query(`INSERT INTO task_submissions (task_id, player_id) VALUES ($1, $2) returning submitted_at`, [taskId, user.user_id]);
        // add notification to all coaches in the team
        const teamIdResult = yield client.query(`SELECT team_id FROM mastery_tasks WHERE task_id = $1`, [taskId]);
        const team_id = (_a = teamIdResult.rows[0]) === null || _a === void 0 ? void 0 : _a.team_id;
        if (!team_id) {
            throw new Error("Team not found for the given task");
        }
        const node_id_result = yield client.query(`SELECT node_id FROM mastery_tasks WHERE task_id = $1`, [taskId]);
        const node_id = (_b = node_id_result.rows[0]) === null || _b === void 0 ? void 0 : _b.node_id;
        if (!node_id) {
            throw new Error("Node not found for the given task");
        }
        const coachesIdsResult = yield client.query(`SELECT user_id FROM team_memberships 
            WHERE team_id = $1 AND role = $2`, [team_id, 'Coach']);
        // get player name
        const playerNameResult = yield client.query(`SELECT first_name, last_name FROM users WHERE user_id = $1`, [user.user_id]);
        const playerName = `${playerNameResult.rows[0].first_name} ${playerNameResult.rows[0].last_name}`;
        // loop through each coachID and add a notification
        for (const coach of coachesIdsResult.rows) {
            yield client.query(`INSERT INTO notifications (user_id, type, sent_from_id, content, team_id, node_id, task_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`, [coach.user_id, 'player_submitted', user.user_id, `Player ${playerName} has submitted a task!`, team_id, node_id, taskId]);
        }
        yield client.query("COMMIT");
        client.release();
        res.status(201).json({
            message: "Task submitted successfully",
            submittedAt: result.rows[0].submitted_at
        });
        return;
    }
    catch (error) {
        console.error("Error submitting task:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});
exports.postTaskSubmit = postTaskSubmit;
const postTaskComplete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
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
    const client = yield db_1.default.connect();
    try {
        yield client.query("BEGIN");
        // access database, add row to task_completions table
        yield client.query(`INSERT INTO task_completions (task_id, player_id) VALUES ($1, $2)`, [taskId, player_id]);
        // add row to notifications table
        const node_id = (yield client.query(`SELECT node_id FROM mastery_tasks WHERE task_id = $1`, [taskId])).rows[0].node_id;
        yield client.query(`INSERT INTO notifications (user_id, sent_from_id, type, content, team_id, node_id, task_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [player_id, user.user_id, 'task_completed', `Coach has approved your submission!`, team_id, node_id, taskId]);
        yield client.query("COMMIT");
        client.release();
        // send response
        res.status(201).json({ message: "Task marked as complete successfully" });
        return;
    }
    catch (error) {
        console.error("Error marking task as complete:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});
exports.postTaskComplete = postTaskComplete;
const postTaskUnapprove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
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
        const client = yield db_1.default.connect();
        yield client.query("BEGIN");
        // delete row from task_submissions table
        yield client.query(`DELETE FROM task_submissions WHERE task_id = $1 AND player_id = $2`, [taskId, player_id]);
        yield client.query(`DELETE FROM task_completions WHERE task_id = $1 AND player_id = $2`, [taskId, player_id]);
        const node_id = (yield client.query(`SELECT node_id FROM mastery_tasks WHERE task_id = $1`, [taskId])).rows[0].node_id;
        // add row to notifications table
        yield client.query(`INSERT INTO notifications (user_id, sent_from_id, type, content, team_id, node_id, task_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`, [player_id, user.user_id, 'task_unapproved', `Coach has unapproved your submission, try again!`, team_id, node_id, taskId]);
        yield client.query("COMMIT");
        client.release();
        res.status(200).json({ message: "Task unapproved successfully" });
    }
    catch (error) {
        console.error("Error unapproving task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.postTaskUnapprove = postTaskUnapprove;
const editDescription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { team_id, taskId } = req.params;
    const { description } = req.body;
    if (!team_id || !taskId || description === undefined) {
        res.status(400).json({ message: "Team ID, Task ID, and new description are required" });
        return;
    }
    try {
        const client = yield db_1.default.connect();
        yield client.query("BEGIN");
        yield client.query(`UPDATE mastery_tasks SET description = $1 WHERE team_id = $2 AND task_id = $3`, [description, team_id, taskId]);
        yield client.query("COMMIT");
        client.release();
        res.status(200).json({ message: "Task description updated successfully" });
    }
    catch (error) {
        console.error("Error updating task description:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.editDescription = editDescription;
const deleteTaskSubmit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;
    try {
        const result = yield db_1.default.query(`DELETE FROM task_submissions WHERE task_id = $1 AND player_id = $2`, [taskId, user.user_id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: "Submission not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting task submission:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteTaskSubmit = deleteTaskSubmit;
