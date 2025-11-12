"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../lib/authMiddleware");
const multerMiddlware_1 = __importDefault(require("../lib/multerMiddlware"));
const posts_1 = require("../handlers/posts");
const router = (0, express_1.Router)();
router.get('/coachResources/:team_id/:taskId', authMiddleware_1.isAuth, posts_1.getCoachResources);
router.get('/playerSubmissions/:team_id/:taskId', authMiddleware_1.isAuth, authMiddleware_1.isCoach, authMiddleware_1.checkTeamMembership, posts_1.getPlayerSubmissions);
router.get('/myMedia/:team_id/:taskId', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, posts_1.getMySubmissions);
router.get('/playerSubmission/:team_id/:taskId/:player_id', authMiddleware_1.isAuth, authMiddleware_1.isCoach, authMiddleware_1.checkTeamMembership, posts_1.getSubmission);
// if I want to use isCoach, I make sure team_id is in the url
// Profile picture upload endpoint can be used without being in a team
router.post('/pp', authMiddleware_1.isAuth, multerMiddlware_1.default.single('profile_picture'), posts_1.postProfilePicture);
router.post('/:team_id', authMiddleware_1.isAuth, authMiddleware_1.isCoach, authMiddleware_1.checkTeamMembership, multerMiddlware_1.default.single('media'), posts_1.postTeamImage);
router.post('/:team_id/coach', authMiddleware_1.isAuth, authMiddleware_1.isCoach, authMiddleware_1.checkTeamMembership, multerMiddlware_1.default.single('media'), posts_1.postCoachResource);
router.post('/:team_id/player', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, multerMiddlware_1.default.single('media'), posts_1.postPlayerSubmission);
router.delete('/:team_id', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, posts_1.deletePost);
exports.default = router;
