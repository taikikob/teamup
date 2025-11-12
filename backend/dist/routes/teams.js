"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_1 = require("../handlers/teams");
const authMiddleware_1 = require("../lib/authMiddleware");
const router = (0, express_1.Router)();
// all routes using isCoach or checkTeamMembership should have team_id in the url
router.get('/', authMiddleware_1.isAuth, teams_1.getTeams);
router.post('/create', authMiddleware_1.isAuth, teams_1.postCreate);
router.post('/join', authMiddleware_1.isAuth, teams_1.postJoin);
router.get('/:team_id', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, teams_1.getTeamInfo);
router.get('/:team_id/flow', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, teams_1.getTeamFlow);
router.post('/:team_id/newAccessCode', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.newAC);
router.get('/:team_id/:node_id/tasks', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, teams_1.getNodeTasks); // Assuming this is the correct route for fetching levels
router.post('/:team_id/flow', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.postFlow);
router.post('/:team_id/node-label', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.updateNodeLabel);
router.post('/:team_id/:node_id/tasks', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.postCreateTask);
router.put('/:team_id/name', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.changeTeamName);
router.put('/:team_id/:node_id/tasks/order', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.updateTaskOrder);
router.patch('/:team_id/editDescription', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.editDescription);
router.delete('/:team_id', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.deleteTeam);
router.delete('/:team_id/player/:player_id', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.deletePlayer);
router.delete('/:team_id/delAccessCode', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.deleteAC);
router.delete('/:team_id/leave', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, teams_1.handleLeaveTeam);
router.delete('/:team_id/:node_id/tasks/:task_id', authMiddleware_1.isAuth, authMiddleware_1.checkTeamMembership, authMiddleware_1.isCoach, teams_1.deleteTask);
exports.default = router;
