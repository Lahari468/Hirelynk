import { z } from "zod";
import { UserRole } from "@prisma/client";

// Password validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Company data for recruiter registration
const companySchema = z.object({
  name: z
    .string()
    .min(2, "Company name is required")
    .max(200, "Company name is too long"),
  description: z.string().max(2000).optional(),
  website: z
    .string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal("")),
  location: z.string().max(200).optional(),
});

export const registerCandidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
  role: z.literal(UserRole.CANDIDATE),
});

export const registerRecruiterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
  role: z.literal(UserRole.RECRUITER),
  company: companySchema,
});

export const registerSchema = z.union([
  registerCandidateSchema,
  registerRecruiterSchema,
]);

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RecruiterRegisterRequest = z.infer<typeof registerRecruiterSchema>;
export type CandidateRegisterRequest = z.infer<typeof registerCandidateSchema>;