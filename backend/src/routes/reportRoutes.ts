import { Router } from "express";
import * as reportController from "../controllers/reportController.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// POST /api/reports - submit a report against a legitimate HireLynk entity
router.post("/", authenticate, asyncHandler(reportController.createReport));

// GET /api/reports - list the authenticated user's own reports
router.get("/", authenticate, asyncHandler(reportController.listMyReports));

// GET /api/reports/:id - get a single report the user submitted
router.get("/:id", authenticate, asyncHandler(reportController.getMyReport));

export default router;