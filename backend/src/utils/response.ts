import { Response } from "express";
import { ApiResponse } from "../types/index.js";

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };

  return res.status(statusCode).json(response);
};

export const ok = <T>(res: Response, message: string, data?: T): Response => {
  return sendSuccess(res, 200, message, data);
};

export const created = <T>(res: Response, message: string, data?: T): Response => {
  return sendSuccess(res, 201, message, data);
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(response);
};