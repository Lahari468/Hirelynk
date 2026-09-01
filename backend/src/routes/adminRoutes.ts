import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Admin routes - all require authentication and ADMIN role
 */

// GET /api/admin/dashboard
router.get(
  "/dashboard",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.getDashboard)
);

// GET /api/admin/users
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listUsers)
);

// GET /api/admin/users/:id
router.get(
  "/users/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.getUserDetails)
);

// GET /api/admin/jobs
router.get(
  "/jobs",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listJobs)
);

// GET /api/admin/jobs/:id
router.get(
  "/jobs/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.getJobDetails)
);

// GET /api/admin/companies (existing - reuse)
router.get(
  "/companies",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listCompanies)
);

// GET /api/admin/recruiters (existing - reuse)
router.get(
  "/recruiters",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listRecruiters)
);

// GET /api/admin/audit-logs
router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listAuditLogs)
);

export default router;