import { Router } from "express";
import * as adminAnalyticsController from "../controllers/adminAnalyticsController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Admin analytics routes
 */

// GET /api/admin/dashboard
router.get(
  "/dashboard",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(adminAnalyticsController.getAdminDashboard)
);

export default router;