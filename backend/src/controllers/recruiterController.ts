import { AsyncController } from "../types/index.js";
import { updateRecruiterProfileSchema } from "../validators/recruiterValidator.js";
import * as recruiterService from "../services/recruiterService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/recruiters/me
 * Get authenticated recruiter's profile
 */
export const getMyProfile: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const profile = await recruiterService.getRecruiterProfile(req.user.id);

  ok(res, "Recruiter profile retrieved", profile);
};

/**
 * PUT /api/recruiters/me
 * Update authenticated recruiter's profile
 */
export const updateMyProfile: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = updateRecruiterProfileSchema.parse(req.body);
  const profile = await recruiterService.updateRecruiterProfile(req.user.id, data);

  ok(res, "Recruiter profile updated successfully", profile);
};