import { AsyncController } from "../types/index.js";
import { updateCandidateProfileSchema } from "../validators/candidateValidator.js";
import * as candidateService from "../services/candidateService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/candidates/me
 * Get authenticated candidate's profile
 */
export const getCandidateProfile: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const profile = await candidateService.getCandidateProfile(req.user.id);

  ok(res, "Candidate profile retrieved", profile);
};

/**
 * PUT /api/candidates/me
 * Update authenticated candidate's profile
 */
export const updateCandidateProfile: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = updateCandidateProfileSchema.parse(req.body);
  const profile = await candidateService.updateCandidateProfile(req.user.id, data);

  ok(res, "Candidate profile updated successfully", profile);
};