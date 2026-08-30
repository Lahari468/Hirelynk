import { Router, Request, Response } from "express";
import { ok } from "../utils/response.js";
import authRoutes from "./authRoutes.js";

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

export default router;