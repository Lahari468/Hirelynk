import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../types/index.js";
import { sendError } from "../utils/response.js";
import { isDevelopment } from "../config/env.js";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (isDevelopment) {
    console.error("❌ Error:", err);
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const errorMap = err.flatten((issue) => ({
      message: issue.message,
      code: issue.code,
    }));

    const details: Record<string, unknown> = {};
    Object.entries(errorMap.fieldErrors).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        details[key] = value[0].message;
      }
    });

    sendError(res, 400, "VALIDATION_ERROR", "Validation failed", details);
    return;
  }

  if (err instanceof Error) {
    const statusCode = 500;
    const code = "INTERNAL_SERVER_ERROR";
    const message = isDevelopment ? err.message : "An unexpected error occurred";

    sendError(res, statusCode, code, message);
    return;
  }

  sendError(res, 500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};