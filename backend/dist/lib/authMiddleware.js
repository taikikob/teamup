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
exports.checkTeamMembership = exports.isCoach = exports.isAuth = void 0;
const db_1 = __importDefault(require("../db"));
const isAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        next();
    }
    else {
        res.status(401).json({ msg: 'You are not authorized to view this resource' });
    }
};
exports.isAuth = isAuth;
const isCoach = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // I must check the database manually here since I can't trust any data coming from frontend
    const user = req.user;
    const userId = user === null || user === void 0 ? void 0 : user.user_id;
    const teamId = parseInt(req.params.team_id || '', 10);
    // validate userID 
    if (!userId || typeof userId !== 'number') {
        // This scenario means `isAuth` either failed or didn't run,
        // or the `user_id` property isn't correctly populated.
        // It's a critical error on the backend if `isAuth` was supposed to run first.
        // However, it's good to be defensive.
        console.error("Authorization error: User ID missing or invalid from authentication middleware.");
        res.status(401).json({ message: 'Unauthorized: Authentication required or session invalid.' });
        return;
    }
    // validate teamID
    if (isNaN(teamId)) {
        // If team_id from URL is not a valid number
        res.status(400).json({ message: 'Bad Request: Invalid Team ID provided in URL.' });
        return;
    }
    // Optionally, if teamId should always be positive:
    if (teamId <= 0) {
        res.status(400).json({ message: 'Bad Request: Team ID must be a positive number.' });
        return;
    }
    // check database if user is coach
    try {
        const query = `
      SELECT 1
      FROM team_memberships
      WHERE user_id = $1 AND team_id = $2 AND role = 'Coach';
    `;
        const result = yield db_1.default.query(query, [userId, teamId]);
        if (result.rows.length > 0) {
            // User is a coach of this specific team. Proceed to the next middleware/route handler.
            next();
        }
        else {
            // User is authenticated but is NOT a coach of this team.
            console.warn(`Forbidden: User ${userId} is not a coach of team ${teamId}.`);
            res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action for this team.' });
        }
    }
    catch (error) {
        console.error('Database error during coach authorization check:', error);
        res.status(500).json({ message: 'Internal Server Error during authorization check.' });
    }
});
exports.isCoach = isCoach;
const checkTeamMembership = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const user_id = user.user_id;
    const team_id = parseInt(req.params.team_id || '', 10);
    if (!user_id || isNaN(team_id)) {
        res.status(400).json({ message: 'Bad Request: Invalid user ID or team ID.' });
        return;
    }
    try {
        const query = `
      SELECT 1
      FROM team_memberships
      WHERE user_id = $1 AND team_id = $2;
    `;
        const result = yield db_1.default.query(query, [user_id, team_id]);
        if (result.rows.length > 0) {
            // User is a member of the team
            next();
        }
        else {
            // User is not a member of the team
            res.status(403).json({ message: 'Forbidden: You are not a member of this team.' });
        }
    }
    catch (error) {
        console.error('Error checking team membership:', error);
        res.status(500).json({ message: 'Internal Server Error' });
        return;
    }
});
exports.checkTeamMembership = checkTeamMembership;
// export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
//   if (req.isAuthenticated() && req.user.admin) {
//     next();
//   } else {
//     res.status(401).json({ msg: 'You are not authorized to view this resource since you are not admin'});
//   }
// }
