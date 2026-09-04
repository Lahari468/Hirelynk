import { AsyncController } from "../types/index.js";
import {
  adminReportListQuerySchema,
  adminUpdateReportSchema,
} from "../validators/reportValidator.js";
import { uuidSchema } from "../validators/adminValidator.js";
import * as reportService from "../services/reportService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/admin/reports
 * List all reports, optionally filtered by status/targetType
 */
export const adminListReports: AsyncController = async (req, res) => {
  const query = adminReportListQuerySchema.parse(req.query);
  const result = await reportService.adminListReports(query);

  ok(res, "Reports retrieved", result);
};

/**
 * GET /api/admin/reports/:id
 * Get a single report's details
 */
export const adminGetReport: AsyncController = async (req, res) => {
  const { id } = uuidSchema.parse({ id: req.params.id });
  const report = await reportService.adminGetReport(id);

  ok(res, "Report retrieved", report);
};

/**
 * PATCH /api/admin/reports/:id
 * Review, resolve, or dismiss a report
 */
export const adminUpdateReport: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = uuidSchema.parse({ id: req.params.id });
  const data = adminUpdateReportSchema.parse(req.body);
  const report = await reportService.adminUpdateReport(
    id,
    req.user.id,
    data
  );

  ok(res, "Report updated successfully", report);
};