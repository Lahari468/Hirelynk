import { AsyncController } from "../types/index.js";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  feedbackIdParamSchema,
  feedbackListQuerySchema,
} from "../validators/feedbackValidator.js";
import * as feedbackService from "../services/feedbackService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/feedback
 * Create feedback tied to a legitimate recruitment relationship
 */
export const createFeedback: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createFeedbackSchema.parse(req.body);
  const feedback = await feedbackService.createFeedback(
    req.user.id,
    req.user.role,
    data
  );

  created(res, "Feedback submitted successfully", feedback);
};

/**
 * GET /api/feedback
 * List feedback the authenticated user is entitled to see
 * (optionally scoped to a single application via ?applicationId=)
 */
export const listFeedback: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = feedbackListQuerySchema.parse(req.query);
  const result = await feedbackService.listFeedback(
    req.user.id,
    req.user.role,
    query
  );

  ok(res, "Feedback retrieved", result);
};

/**
 * GET /api/feedback/:id
 * Get a single feedback entry (with ownership/participant check)
 */
export const getFeedback: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = feedbackIdParamSchema.parse(req.params);
  const feedback = await feedbackService.getFeedback(
    id,
    req.user.id,
    req.user.role
  );

  ok(res, "Feedback retrieved", feedback);
};

/**
 * PATCH /api/feedback/:id
 * Update feedback (author only)
 */
export const updateFeedback: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = feedbackIdParamSchema.parse(req.params);
  const data = updateFeedbackSchema.parse(req.body);
  const feedback = await feedbackService.updateFeedback(
    id,
    req.user.id,
    req.user.role,
    data
  );

  ok(res, "Feedback updated successfully", feedback);
};