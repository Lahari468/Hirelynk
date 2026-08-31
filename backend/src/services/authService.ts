import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../types/index.js";
import type {
  RecruiterRegisterRequest,
  CandidateRegisterRequest,
} from "../validators/authValidator.js";

const prisma = new PrismaClient();


interface LoginData {
  email: string;
  password: string;
}

interface CandidateAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

interface RecruiterAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
  company: {
    id: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new candidate
 */
export const registerCandidate = async (
  data: CandidateRegisterRequest
): Promise<CandidateAuthResponse> => {
  const normalizedEmail = data.email.toLowerCase();

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email already in use", { email: normalizedEmail });
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user and candidate profile in transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.CANDIDATE,
        isActive: true,
      },
    });

    // Create candidate profile
    await tx.candidateProfile.create({
      data: {
        userId: user.id,
      },
    });

    return user;
  });

  // Generate tokens
  const accessToken = generateAccessToken(result.id, result.role);
  const refreshToken = generateRefreshToken(result.id, result.role);

  return {
    user: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      isActive: result.isActive,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Register a new recruiter with company
 */
export const registerRecruiter = async (
  data: RecruiterRegisterRequest
): Promise<RecruiterAuthResponse> => {
  const normalizedEmail = data.email.toLowerCase();

  // Validate company data is present
  if (!data.company || !data.company.name) {
    throw new ValidationError("Company information is required for recruiter registration");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email already in use", { email: normalizedEmail });
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Normalize URLs
  const website = data.company.website
    ? data.company.website.trim() || null
    : null;

  // Create user, company, and recruiter profile in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.RECRUITER,
        isActive: true,
      },
    });

    // Create company
    const company = await tx.company.create({
      data: {
        name: data.company.name,
        description: data.company.description || null,
        website,
        logoUrl: null,
        location: data.company.location || null,
      },
    });

    // Create recruiter profile with the new company
    await tx.recruiterProfile.create({
      data: {
        userId: user.id,
        companyId: company.id,
        jobTitle: null,
      },
    });

    return { user, company };
  });

  // Generate tokens
  const accessToken = generateAccessToken(result.user.id, result.user.role);
  const refreshToken = generateRefreshToken(result.user.id, result.user.role);

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      isActive: result.user.isActive,
    },
    company: {
      id: result.company.id,
      name: result.company.name,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<CandidateAuthResponse> => {
  const normalizedEmail = data.email.toLowerCase();

  // Find user (use generic error to not reveal if email exists)
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AuthenticationError("This account has been suspended");
  }

  // Verify password
  const passwordValid = await verifyPassword(data.password, user.passwordHash);

  if (!passwordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  // Create audit log for login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  userId: string
): Promise<{ accessToken: string }> => {
  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.isActive) {
    throw new AuthenticationError("This account has been suspended");
  }

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.role);

  return { accessToken };
};

/**
 * Get current user by ID
 */
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};