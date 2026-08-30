import { Router, Request, Response } from "express";
import { ok } from "../utils/response.js";

const router = Router();

router.get("/health", (_req: Request, res: Response): void => {
  ok(res, "Hirelynk API is running");
});

router.get("/", (_req: Request, res: Response): void => {
  ok(res, "Welcome to Hirelynk API", {
    version: "1.0.0",
    status: "running",
  });
});

export default router;