import { AsyncController } from "../types/index.js";
import { adminDashboardQuerySchema } from "../validators/adminAnalyticsValidator.js";
import * as adminAnalyticsService from "../services/adminAnalyticsService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/admin/dashboard
 * Get comprehensive admin analytics dashboard
 */
export const getAdminDashboard: AsyncController = async (req, res) => {
  const query = adminDashboardQuerySchema.parse(req.query);
  const dashboard = await adminAnalyticsService.getAdminDashboard(query);

  ok(res, "Admin dashboard retrieved", dashboard);
};