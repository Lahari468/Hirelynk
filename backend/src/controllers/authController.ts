import { AsyncController } from "../types/index.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";
import * as authService from "../services/authService.js";
import { created, ok } from "../utils/response.js";
import { isDevelopment } from "../config/env.js";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !isDevelopment,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

/**
 * POST /api/auth/register
 * Register a new candidate or recruiter
 */
export const register: AsyncController = async (req, res) => {
  const data = registerSchema.parse(req.body);
  const result =
    data.role === "CANDIDATE"
      ? await authService.registerCandidate(data)
      : await authService.registerRecruiter(data);

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  created(res, "Registration successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
};

/**
 * POST /api/auth/login
 * Login user and return access token
 */
export const login: AsyncController = async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

  ok(res, "Login successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
};

/**
 * POST /api/auth/refresh
 * Refresh the access token using refresh token from cookie
 */
export const refresh: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const result = await authService.refreshAccessToken(req.user.id);

  ok(res, "Token refreshed", {
    accessToken: result.accessToken,
  });
};

/**
 * POST /api/auth/logout
 * Logout user by clearing refresh token cookie
 */
export const logout: AsyncController = async (_req, res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    path: "/",
  });

  ok(res, "Logged out successfully");
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getCurrentUser: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const user = await authService.getCurrentUser(req.user.id);

  ok(res, "Current user retrieved", user);
};