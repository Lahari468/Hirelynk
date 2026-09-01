import { z } from "zod";

export const adminDashboardQuerySchema = z.object({
  recentLimit: z.coerce.number().int().min(1).max(20).default(10),
});

export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;