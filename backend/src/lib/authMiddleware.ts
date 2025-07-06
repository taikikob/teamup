import { Request, Response, NextFunction } from "express-serve-static-core";
import pool from '../db';
import { User } from "../types/User";

export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ msg: 'You are not authorized to view this resource' });
  }
};

export const isCoach = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // I must check the database manually here since I can't trust any data coming from frontend
  const user = req.user as User;
  const userId = user?.user_id;
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
    const result = await pool.query(query, [userId, teamId]);
    if (result.rows.length > 0) {
        // User is a coach of this specific team. Proceed to the next middleware/route handler.
        next();
    } else {
        // User is authenticated but is NOT a coach of this team.
        console.warn(`Forbidden: User ${userId} is not a coach of team ${teamId}.`);
        res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action for this team.' });
    }
  } catch (error) {
    console.error('Database error during coach authorization check:', error);
    res.status(500).json({ message: 'Internal Server Error during authorization check.' });
  }
}

// export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
//   if (req.isAuthenticated() && req.user.admin) {
//     next();
//   } else {
//     res.status(401).json({ msg: 'You are not authorized to view this resource since you are not admin'});
//   }
// }