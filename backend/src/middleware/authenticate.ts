import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";

/**
 * Middleware to verify JWT access token
 * Extracts user info and attaches to req.user
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "UNAUTHORIZED", "Missing or invalid authorization header");
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid or expired token");
    return;
  }

  req.user = {
    id: decoded.sub,
    role: decoded.role,
  };

  next();
};