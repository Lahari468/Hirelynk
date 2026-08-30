import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Auth routes
 */

router.post("/register", asyncHandler(authController.register));

router.post("/login", asyncHandler(authController.login));

router.post("/refresh", authenticate, asyncHandler(authController.refresh));

router.post("/logout", asyncHandler(authController.logout));

router.get("/me", authenticate, asyncHandler(authController.getCurrentUser));

export default router;