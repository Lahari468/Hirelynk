import { Router, Request, Response } from "express";
import { ok } from "../utils/response.js";
import authRoutes from "./authRoutes.js";
import companyRoutes from "./companyRoutes.js";
import recruiterRoutes from "./recruiterRoutes.js";
import adminRoutes from "./adminRoutes.js";
import jobRoutes from "./jobRoutes.js";
import applicationRoutes from "./applicationRoutes.js";
import resumeRoutes from "./resumeRoutes.js";
import recruiterResumeRoutes from "./recruiterResumeRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import candidateRoutes from "./candidateRoutes.js";
import adminAnalyticsRoutes from "./adminAnalyticsRoutes.js";
import savedJobRoutes from "./savedJobRoutes.js";

const router = Router();

router.get("/health", (_req: Request, res: Response): void => {
  ok(res, "HireLynk API is running");
});

router.get("/", (_req: Request, res: Response): void => {
  ok(res, "Welcome to HireLynk API", {
    version: "1.0.0",
    status: "running",
  });
});

//Auth routes

router.use("/auth", authRoutes);

//Candidate routes
router.use("/candidates/me", candidateRoutes);

// Company routes
router.use("/companies", companyRoutes);

// Recruiter routes
router.use("/recruiters", recruiterRoutes);

// Recruiter resume access routes

router.use("/recruiters/resumes", recruiterResumeRoutes);

// Job routes
router.use("/jobs", jobRoutes);

// Application routes
router.use("/applications", applicationRoutes);

// Candidate resume routes
router.use("/candidates/me/resumes", resumeRoutes);

// Notification routes
router.use("/notifications", notificationRoutes);

// Admin routes
router.use("/admin", adminRoutes);

//Admin analytics routes
router.use("/admin", adminAnalyticsRoutes);

router.use("/candidates/me/saved-jobs", savedJobRoutes);

export default router;