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

router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/recruiters", recruiterRoutes);
router.use("/recruiters/resumes", recruiterResumeRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/candidates/me/resumes", resumeRoutes);
router.use("/admin", adminRoutes);

export default router;