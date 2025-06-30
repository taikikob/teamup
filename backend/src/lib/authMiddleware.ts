import { Request, Response, NextFunction } from 'express';

export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ msg: 'You are not authorized to view this resource' });
  }
};

// export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
//   if (req.isAuthenticated() && req.user.admin) {
//     next();
//   } else {
//     res.status(401).json({ msg: 'You are not authorized to view this resource since you are not admin'});
//   }
// }