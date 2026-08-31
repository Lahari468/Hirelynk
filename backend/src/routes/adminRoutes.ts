import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Admin routes
 * All require authentication and ADMIN role
 */

// GET /api/admin/companies
router.get(
  "/companies",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listCompanies)
);

// GET /api/admin/recruiters
router.get(
  "/recruiters",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminController.listRecruiters)
);

export default router;