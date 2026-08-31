import { AsyncController } from "../types/index.js";
import {
  createCompanySchema,
  updateCompanySchema,
} from "../validators/companyValidator.js";
import * as companyService from "../services/companyService.js";
import { created, ok } from "../utils/response.js";

/**
 * POST /api/companies
 * Create a company and associate with authenticated recruiter
 */
export const createCompany: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = createCompanySchema.parse(req.body);
  const company = await companyService.createCompany(req.user.id, data);

  created(res, "Company created successfully", company);
};

/**
 * GET /api/companies/me
 * Get company associated with authenticated recruiter
 */
export const getMyCompany: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const company = await companyService.getRecruiterCompany(req.user.id);

  ok(res, "Company retrieved", company);
};

/**
 * PUT /api/companies/me
 * Update company associated with authenticated recruiter
 */
export const updateMyCompany: AsyncController = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const data = updateCompanySchema.parse(req.body);
  const company = await companyService.updateRecruiterCompany(req.user.id, data);

  ok(res, "Company updated successfully", company);
};