import { Router } from "express";
import * as adminReportController from "../controllers/adminReportController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Admin report moderation routes - all require authentication and ADMIN role
 */

// GET /api/admin/reports
router.get(
  "/reports",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminReportController.adminListReports)
);

// GET /api/admin/reports/:id
router.get(
  "/reports/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminReportController.adminGetReport)
);

// PATCH /api/admin/reports/:id
router.patch(
  "/reports/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminReportController.adminUpdateReport)
);

export default router;