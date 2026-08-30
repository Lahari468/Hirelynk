import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  sub: string; // user ID
  role: string; // user role
}

interface VerifiedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate access token
 */
export const generateAccessToken = (userId: string, role: string): string => {
  const payload: TokenPayload = {
    sub: userId,
    role,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string, role: string): string => {
  const payload: TokenPayload = {
    sub: userId,
    role,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): VerifiedToken | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return decoded as VerifiedToken;
  } catch {
    return null;
  }
};

/**
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): VerifiedToken | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
    });
    return decoded as VerifiedToken;
  } catch {
    return null;
  }
};