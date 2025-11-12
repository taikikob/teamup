"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../lib/authMiddleware");
const comments_1 = require("../handlers/comments");
const router = (0, express_1.Router)();
// all routes using isCoach or checkTeamMembership should have team_id in the url
router.get('/:team_id/:taskId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, comments_1.getCommentsForTask);
router.post('/:team_id', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, comments_1.addComment);
router.delete('/:team_id/:commentId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, comments_1.deleteComment);
exports.default = router;
