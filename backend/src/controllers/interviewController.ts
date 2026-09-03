import { AsyncController } from "../types/index.js";
import {
  createInterviewSchema,
  updateInterviewSchema,
  completeInterviewSchema,
  interviewListQuerySchema,
} from "../validators/interviewValidator.js";
import * as interviewService from "../services/interviewService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/interviews
 * Create an interview (recruiter only)
 */
export const createInterview: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createInterviewSchema.parse(req.body);
  const interview = await interviewService.createInterview(req.user.id, data);

  created(res, "Interview scheduled successfully", interview);
};

/**
 * GET /api/interviews/mine
 * Get user's interviews (role-based)
 * - Recruiters see all interviews they scheduled
 * - Candidates see all their interviews
 */
export const getMyInterviews: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = interviewListQuerySchema.parse(req.query);

  let result;
  if (req.user.role === "RECRUITER") {
    result = await interviewService.getRecruiterInterviews(req.user.id, query);
  } else if (req.user.role === "CANDIDATE") {
    result = await interviewService.getCandidateInterviews(req.user.id, query);
  } else {
    res.status(403).json({
      success: false,
      message: "Forbidden",
    });
    return;
  }

  ok(res, "Interviews retrieved", result);
};

/**
 * GET /api/interviews/:id
 * Get single interview (with ownership check)
 */
export const getInterview: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const interview = await interviewService.getInterview(
    id,
    req.user.id,
    req.user.role
  );

  ok(res, "Interview retrieved", interview);
};

/**
 * PATCH /api/interviews/:id
 * Update interview (recruiter only)
 */
export const updateInterview: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const data = updateInterviewSchema.parse(req.body);
  const interview = await interviewService.updateInterview(
    id,
    req.user.id,
    data
  );

  ok(res, "Interview updated successfully", interview);
};

/**
 * PATCH /api/interviews/:id/cancel
 * Cancel interview (recruiter only)
 */
export const cancelInterview: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const interview = await interviewService.cancelInterview(id, req.user.id);

  ok(res, "Interview cancelled successfully", interview);
};

/**
 * PATCH /api/interviews/:id/complete
 * Complete interview with feedback (recruiter only)
 */
export const completeInterview: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const data = completeInterviewSchema.parse(req.body);
  const interview = await interviewService.completeInterview(
    id,
    req.user.id,
    data
  );

  ok(res, "Interview completed successfully", interview);
};