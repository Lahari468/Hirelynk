import { Router } from "express";
import * as companyController from "../controllers/companyController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Company routes
 * All require authentication and RECRUITER role
 */

// POST /api/companies
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(companyController.createCompany)
);

// GET /api/companies/me
router.get(
  "/me",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(companyController.getMyCompany)
);

// PUT /api/companies/me
router.put(
  "/me",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(companyController.updateMyCompany)
);

export default router;