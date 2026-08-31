import { AsyncController } from "../types/index.js";
import * as adminService from "../services/adminService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/admin/companies
 * List companies with pagination and search
 */
export const listCompanies: AsyncController = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit as string, 10) || 10)
  );
  const search = (req.query.search as string) || undefined;

  const result = await adminService.listCompanies({ page, limit, search });

  ok(res, "Companies retrieved", result);
};

/**
 * GET /api/admin/recruiters
 * List recruiters with pagination and search
 */
export const listRecruiters: AsyncController = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit as string, 10) || 10)
  );
  const search = (req.query.search as string) || undefined;

  const result = await adminService.listRecruiters({ page, limit, search });

  ok(res, "Recruiters retrieved", result);
};