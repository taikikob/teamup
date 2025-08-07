import "express";

declare global {
  namespace Express {
    interface User {
      user_id: number;
      username: string;
      first_name: string;
      last_name: string;
    }
  }
}

export {}; // 👈 ensures this file is treated as a module