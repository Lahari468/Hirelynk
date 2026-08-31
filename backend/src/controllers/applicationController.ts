import { AsyncController } from "../types/index.js";
import {
  createApplicationSchema,
  applicationStatusUpdateSchema,
  applicationListQuerySchema,
} from "../validators/applicationValidator.js";
import * as applicationService from "../services/applicationService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/applications
 * Create an application (candidate only)
 */
export const createApplication: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createApplicationSchema.parse(req.body);
  const application = await applicationService.createApplication(req.user.id, data);

  created(res, "Application submitted successfully", application);
};

/**
 * GET /api/applications/mine
 * Get candidate's applications
 */
export const getMyApplications: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const query = applicationListQuerySchema.parse(req.query);
  const result = await applicationService.getCandidateApplications(req.user.id, query);

  ok(res, "Applications retrieved", result);
};

/**
 * GET /api/applications/:id
 * Get single application (candidate view)
 */
export const getApplication: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const application = await applicationService.getCandidateApplication(id, req.user.id);

  ok(res, "Application retrieved", application);
};

/**
 * GET /api/applications/job/:jobId
 * Get applications for a recruiter's job
 */
export const getJobApplications: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { jobId } = req.params;
  const query = applicationListQuerySchema.parse(req.query);
  const result = await applicationService.getJobApplications(jobId, req.user.id, query);

  ok(res, "Applications retrieved", result);
};

/**
 * GET /api/applications/:id/recruiter
 * Get single application (recruiter view)
 */
export const getRecruiterApplication: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const application = await applicationService.getRecruiterApplication(id, req.user.id);

  ok(res, "Application retrieved", application);
};

/**
 * PATCH /api/applications/:id/status
 * Update application status (recruiter only)
 */
export const updateApplicationStatus: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const { id } = req.params;
  const data = applicationStatusUpdateSchema.parse(req.body);
  const application = await applicationService.updateApplicationStatus(id, req.user.id, data);

  ok(res, "Application status updated successfully", application);
};