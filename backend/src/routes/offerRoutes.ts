import { Router } from "express";
import * as offerController from "../controllers/offerController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * Recruiter routes
 */

// POST /api/offers - create offer
router.post(
  "/",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(offerController.createOffer)
);

// GET /api/offers/mine - get user's offers (both recruiter and candidate)
router.get(
  "/mine",
  authenticate,
  asyncHandler(offerController.getMyOffers)
);

/**
 * Generic routes - registered after specific ones to avoid conflicts
 */

// GET /api/offers/:id - get single offer
router.get(
  "/:id",
  authenticate,
  asyncHandler(offerController.getOffer)
);

// PATCH /api/offers/:id - update offer (recruiter only)
router.patch(
  "/:id",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(offerController.updateOffer)
);

// PATCH /api/offers/:id/accept - accept offer (candidate only)
router.patch(
  "/:id/accept",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(offerController.acceptOffer)
);

// PATCH /api/offers/:id/reject - reject offer (candidate only)
router.patch(
  "/:id/reject",
  authenticate,
  authorize("CANDIDATE"),
  asyncHandler(offerController.rejectOffer)
);

// PATCH /api/offers/:id/withdraw - withdraw offer (recruiter only)
router.patch(
  "/:id/withdraw",
  authenticate,
  authorize("RECRUITER"),
  asyncHandler(offerController.withdrawOffer)
);

export default router;