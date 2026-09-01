import { AsyncController } from "../types/index.js";
import {
  recruiterDashboardQuerySchema,
  applicationListQuerySchema,
} from "../validators/recruiterDashboardValidator.js";
import * as recruiterDashboardService from "../services/recruiterDashboardService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/recruiters/dashboard
 * Get recruiter dashboard with statistics
 */
export const getRecruiterDashboard: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = recruiterDashboardQuerySchema.parse(req.query);
  const dashboard = await recruiterDashboardService.getRecruiterDashboard(
    req.user.id,
    query
  );

  ok(res, "Dashboard retrieved", dashboard);
};

/**
 * GET /api/recruiters/jobs/:jobId/applications
 * List applications for a specific job with filtering
 */
export const listJobApplications: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { jobId } = req.params;
  const query = applicationListQuerySchema.parse(req.query);
  const result = await recruiterDashboardService.listJobApplications(
    jobId,
    req.user.id,
    query
  );

  ok(res, "Applications retrieved", result);
};