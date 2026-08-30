import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/index.js";
import { sendError } from "../utils/response.js";
import { isDevelopment } from "../config/env.js";
import { ZodError } from "zod";

/**
 * Async controller wrapper - catches errors and passes to error handler
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Centralized error handler middleware
 * Must be last middleware
 */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle AppError (custom errors)
  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));

    sendError(res, 400, "VALIDATION_ERROR", "Validation failed", {
      errors: formattedErrors,
    });
    return;
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : "Internal server error";
  const isProduction = !isDevelopment;

  if (isDevelopment) {
    console.error("Error:", error);
  }

  sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    isProduction ? "Internal server error" : message
  );
};