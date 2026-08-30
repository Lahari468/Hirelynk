import { Request, Response, NextFunction } from "express";
import { isDevelopment } from "../config/env.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (!isDevelopment) {
    next();
    return;
  }

  const startTime = Date.now();
  const method = req.method;
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = getStatusColor(statusCode);

    console.log(
      `${statusColor}${statusCode}${"\x1b[0m"} ${method} ${path} (${duration}ms)`
    );
  });

  next();
};

const getStatusColor = (status: number): string => {
  if (status >= 500) return "\x1b[31m";
  if (status >= 400) return "\x1b[33m";
  if (status >= 300) return "\x1b[36m";
  if (status >= 200) return "\x1b[32m";
  return "\x1b[0m";
};