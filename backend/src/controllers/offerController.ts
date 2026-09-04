import { AsyncController } from "../types/index.js";
import {
  createOfferSchema,
  updateOfferSchema,
  offerListQuerySchema,
} from "../validators/offerValidator.js";
import * as offerService from "../services/offerService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/offers
 * Create an offer (recruiter only)
 */
export const createOffer: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createOfferSchema.parse(req.body);
  const offer = await offerService.createOffer(req.user.id, data);

  created(res, "Offer created successfully", offer);
};

/**
 * GET /api/offers/mine
 * Get user's offers (role-based)
 * - Recruiters see all offers they created
 * - Candidates see all their offers
 */
export const getMyOffers: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = offerListQuerySchema.parse(req.query);

  let result;
  if (req.user.role === "RECRUITER") {
    result = await offerService.getRecruiterOffers(req.user.id, query);
  } else if (req.user.role === "CANDIDATE") {
    result = await offerService.getCandidateOffers(req.user.id, query);
  } else {
    res.status(403).json({
      success: false,
      message: "Forbidden",
    });
    return;
  }

  ok(res, "Offers retrieved", result);
};

/**
 * GET /api/offers/:id
 * Get single offer (with ownership check)
 */
export const getOffer: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const offer = await offerService.getOffer(id, req.user.id, req.user.role);

  ok(res, "Offer retrieved", offer);
};

/**
 * PATCH /api/offers/:id
 * Update offer (recruiter only)
 */
export const updateOffer: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const data = updateOfferSchema.parse(req.body);
  const offer = await offerService.updateOffer(id, req.user.id, data);

  ok(res, "Offer updated successfully", offer);
};

/**
 * PATCH /api/offers/:id/accept
 * Accept offer (candidate only)
 */
export const acceptOffer: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const offer = await offerService.acceptOffer(id, req.user.id);

  ok(res, "Offer accepted successfully", offer);
};

/**
 * PATCH /api/offers/:id/reject
 * Reject offer (candidate only)
 */
export const rejectOffer: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const offer = await offerService.rejectOffer(id, req.user.id);

  ok(res, "Offer rejected successfully", offer);
};

/**
 * PATCH /api/offers/:id/withdraw
 * Withdraw offer (recruiter only)
 */
export const withdrawOffer: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const offer = await offerService.withdrawOffer(id, req.user.id);

  ok(res, "Offer withdrawn successfully", offer);
};