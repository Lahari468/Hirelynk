import { Router, Request, Response } from "express";
import { ok } from "../utils/response.js";
import authRoutes from "./authRoutes.js";
import companyRoutes from "./companyRoutes.js";
import recruiterRoutes from "./recruiterRoutes.js";
import adminRoutes from "./adminRoutes.js";
import jobRoutes from "./jobRoutes.js";
import applicationRoutes from "./applicationRoutes.js";

const router = Router();

/**
 * Health check endpoint
 */
router.get("/health", (_req: Request, res: Response): void => {
  ok(res, "HireLynk API is running");
});

/**
 * API root endpoint
 */
router.get("/", (_req: Request, res: Response): void => {
  ok(res, "Welcome to HireLynk API", {
    version: "1.0.0",
    status: "running",
  });
});

/**
 * Auth routes
 */
router.use("/auth", authRoutes);

/**
 * Company routes
 */
router.use("/companies", companyRoutes);

/**
 * Recruiter routes
 */
router.use("/recruiters", recruiterRoutes);

/**
 * Job routes
 */
router.use("/jobs", jobRoutes);

/**
 * Application routes
 */
router.use("/applications", applicationRoutes);

/**
 * Admin routes
 */
router.use("/admin", adminRoutes);

export default router;