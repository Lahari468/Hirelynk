import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";

/**
 * Middleware to check user role authorization
 * Usage: authorize(UserRole.RECRUITER) or authorize(UserRole.RECRUITER, UserRole.ADMIN)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // First check if user is authenticated
    if (!req.user) {
      sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        "FORBIDDEN",
        "You do not have permission to access this resource"
      );
      return;
    }

    next();
  };
};