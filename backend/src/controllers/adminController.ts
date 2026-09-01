import { AsyncController } from "../types/index.js";
import {
  adminUserListSchema,
  adminJobListSchema,
  adminAuditLogListSchema,
  uuidSchema,
} from "../validators/adminValidator.js";
import * as adminService from "../services/adminService.js";
import { ok } from "../utils/response.js";

/**
 * GET /api/admin/dashboard
 * Get platform statistics
 */
export const getDashboard: AsyncController = async (_req, res) => {
  const stats = await adminService.getDashboardStats();
  ok(res, "Dashboard statistics retrieved", stats);
};

/**
 * GET /api/admin/users
 * List users with pagination and filters
 */
export const listUsers: AsyncController = async (req, res) => {
  const params = adminUserListSchema.parse(req.query);
  const result = await adminService.listUsers(params);
  ok(res, "Users retrieved", result);
};

/**
 * GET /api/admin/users/:id
 * Get user details
 */
export const getUserDetails: AsyncController = async (req, res) => {
  const { id } = uuidSchema.parse({ id: req.params.id });
  const user = await adminService.getUserDetails(id);
  ok(res, "User retrieved", user);
};

/**
 * GET /api/admin/jobs
 * List jobs with pagination and filters
 */
export const listJobs: AsyncController = async (req, res) => {
  const params = adminJobListSchema.parse(req.query);
  const result = await adminService.listJobs(params);
  ok(res, "Jobs retrieved", result);
};

/**
 * GET /api/admin/jobs/:id
 * Get job details
 */
export const getJobDetails: AsyncController = async (req, res) => {
  const { id } = uuidSchema.parse({ id: req.params.id });
  const job = await adminService.getJobDetails(id);
  ok(res, "Job retrieved", job);
};

/**
 * GET /api/admin/audit-logs
 * List audit logs with pagination and filters
 */
export const listAuditLogs: AsyncController = async (req, res) => {
  const params = adminAuditLogListSchema.parse(req.query);
  const result = await adminService.listAuditLogs(params);
  ok(res, "Audit logs retrieved", result);
};

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

/**
 * DELETE /api/admin/users/:id
 * Delete a user account
 */
export const deleteUser: AsyncController = async (req, res) => {
  const { id } = uuidSchema.parse({ id: req.params.id });
  await adminService.deleteUser(id);
  ok(res, "User deleted successfully");
};

/**
 * DELETE /api/admin/jobs/:id
 * Delete a job posting
 */
export const deleteJob: AsyncController = async (req, res) => {
  const { id } = uuidSchema.parse({ id: req.params.id });
  await adminService.deleteJob(id);
  ok(res, "Job deleted successfully");
};
