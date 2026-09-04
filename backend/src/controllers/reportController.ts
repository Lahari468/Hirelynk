import { AsyncController } from "../types/index.js";
import {
  createReportSchema,
  reportIdParamSchema,
  reportListQuerySchema,
} from "../validators/reportValidator.js";
import * as reportService from "../services/reportService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/reports
 * Submit a report against a legitimate HireLynk entity. The reporter's
 * identity always comes from the authenticated JWT, never the request body.
 */
export const createReport: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createReportSchema.parse(req.body);
  const report = await reportService.createReport(
    req.user.id,
    req.user.role,
    data
  );

  created(res, "Report submitted successfully", report);
};

/**
 * GET /api/reports
 * List reports the authenticated user has submitted
 */
export const listMyReports: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = reportListQuerySchema.parse(req.query);
  const result = await reportService.listMyReports(req.user.id, query);

  ok(res, "Reports retrieved", result);
};

/**
 * GET /api/reports/:id
 * Get a single report the authenticated user submitted
 */
export const getMyReport: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = reportIdParamSchema.parse(req.params);
  const report = await reportService.getMyReport(id, req.user.id);

  ok(res, "Report retrieved", report);
};