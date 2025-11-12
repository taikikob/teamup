"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../lib/authMiddleware");
const tasks_1 = require("../handlers/tasks");
const router = (0, express_1.Router)();
// all routes using isCoach or checkTeamMembership should have team_id in the url
router.get('/:team_id/status/:taskId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, tasks_1.getTaskStatus);
router.post('/:team_id/submit/:taskId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, tasks_1.postTaskSubmit);
// Used from MarkCompleteButton
router.post('/:team_id/:taskId/complete', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, tasks_1.postTaskComplete);
router.post('/:team_id/:taskId/unapprove', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, tasks_1.postTaskUnapprove);
router.patch('/:team_id/description/:taskId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, tasks_1.editDescription);
router.delete('/:team_id/unsubmit/:taskId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, tasks_1.deleteTaskSubmit);
exports.default = router;
