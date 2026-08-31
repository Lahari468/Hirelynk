import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name is required").max(200),
  description: z.string().max(2000).optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  location: z.string().max(200).optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2, "Company name is required").max(200).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  location: z.string().max(200).optional(),
});

export type CreateCompanyRequest = z.infer<typeof createCompanySchema>;
export type UpdateCompanyRequest = z.infer<typeof updateCompanySchema>;