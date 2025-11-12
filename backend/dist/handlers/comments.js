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
exports.deleteComment = exports.addComment = exports.getCommentsForTask = void 0;
const db_1 = __importDefault(require("../db"));
const getCommentsForTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { taskId } = req.params;
    try {
        const result = yield db_1.default.query(`SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC`, [taskId]);
        // attach sender_name to each comment
        const commentsWithSenderName = yield Promise.all(result.rows.map((comment) => __awaiter(void 0, void 0, void 0, function* () {
            const senderResult = yield db_1.default.query(`SELECT first_name, last_name FROM users WHERE user_id = $1`, [comment.sender_id]);
            const sender = senderResult.rows[0];
            return Object.assign(Object.assign({}, comment), { sender_name: `${sender.first_name} ${sender.last_name}` });
        })));
        res.status(200).json(commentsWithSenderName);
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getCommentsForTask = getCommentsForTask;
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const comment = req.body;
    try {
        // use transaction to ensure atomicity
        const client = yield db_1.default.connect();
        yield client.query('BEGIN');
        const result = yield client.query(`INSERT INTO comments (player_id, sender_id, task_id, content) VALUES ($1, $2, $3, $4) RETURNING *`, [comment.player_id, comment.sender_id, comment.task_id, comment.content]);
        const teamIdResult = yield client.query(`SELECT team_id FROM mastery_tasks WHERE task_id = $1`, [comment.task_id]);
        const team_id = (_a = teamIdResult.rows[0]) === null || _a === void 0 ? void 0 : _a.team_id;
        if (!team_id) {
            throw new Error("Team not found for the given task");
        }
        const node_id_result = yield client.query(`SELECT node_id FROM mastery_tasks WHERE task_id = $1`, [comment.task_id]);
        const node_id = (_b = node_id_result.rows[0]) === null || _b === void 0 ? void 0 : _b.node_id;
        if (!node_id) {
            throw new Error("Node not found for the given task");
        }
        // check whether user is player or coach
        if (comment.player_id === user.user_id) {
            // player has added a comment
            // add notification for all coaches a part of this team
            const coachesIdsResult = yield client.query(`SELECT user_id FROM team_memberships 
                 WHERE team_id = $1 AND role = $2`, [team_id, 'Coach']);
            // loop through each coachID and add a notification
            for (const coach of coachesIdsResult.rows) {
                yield client.query(`INSERT INTO notifications (user_id, type, sent_from_id, content, team_id, node_id, task_id) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`, [coach.user_id, 'player_comment_added', user.user_id, comment.content, team_id, node_id, comment.task_id]);
            }
        }
        else {
            // add notification for the player
            yield client.query(`INSERT INTO notifications (user_id, type, sent_from_id, content, team_id, node_id, task_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`, [comment.player_id, 'coach_comment_added', user.user_id, comment.content, team_id, node_id, comment.task_id]);
        }
        // insert new notification to receiver
        yield client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.addComment = addComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { commentId } = req.params;
    try {
        const result = yield db_1.default.query(`DELETE FROM comments WHERE comment_id = $1 RETURNING *`, [commentId]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteComment = deleteComment;
