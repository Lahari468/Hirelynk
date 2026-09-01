import { prisma } from "../utils/prismaClient.js";
import type { AdminDashboardQuery } from "../validators/adminAnalyticsValidator.js";

interface UserAnalytics {
  total: number;
  candidates: number;
  recruiters: number;
  admins: number;
}

interface JobAnalytics {
  total: number;
  draft: number;
  open: number;
  closed: number;
}

interface ApplicationAnalytics {
  total: number;
  byStatus: Record<string, number>;
}

interface CompanyAnalytics {
  total: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  recruiter: {
    name: string;
  };
  createdAt: Date;
}

interface RecentApplication {
  id: string;
  status: string;
  candidate: {
    name: string;
  };
  job: {
    title: string;
  };
  appliedAt: Date;
}

interface AdminDashboardData {
  users: UserAnalytics;
  jobs: JobAnalytics;
  applications: ApplicationAnalytics;
  companies: CompanyAnalytics;
  recentUsers: RecentUser[];
  recentJobs: RecentJob[];
  recentApplications: RecentApplication[];
}

/**
 * Get comprehensive admin dashboard analytics
 */
export const getAdminDashboard = async (
  query: AdminDashboardQuery
): Promise<AdminDashboardData> => {
  const [users, jobs, applications, companies, recentUsers, recentJobs, recentApps] =
    await Promise.all([
      getUserAnalytics(),
      getJobAnalytics(),
      getApplicationAnalytics(),
      getCompanyAnalytics(),
      getRecentUsers(query.recentLimit),
      getRecentJobs(query.recentLimit),
      getRecentApplications(query.recentLimit),
    ]);

  return {
    users,
    jobs,
    applications,
    companies,
    recentUsers,
    recentJobs,
    recentApplications: recentApps,
  };
};

/**
 * Get user statistics
 */
async function getUserAnalytics(): Promise<UserAnalytics> {
  const [total, candidates, recruiters, admins] = await Promise.all([
    prisma.user.count(),
    prisma.candidateProfile.count(),
    prisma.recruiterProfile.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return { total, candidates, recruiters, admins };
}

/**
 * Get job statistics
 */
async function getJobAnalytics(): Promise<JobAnalytics> {
  const [total, draft, open, closed] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: "DRAFT" } }),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.job.count({ where: { status: "CLOSED" } }),
  ]);

  return { total, draft, open, closed };
}

/**
 * Get application statistics
 */
async function getApplicationAnalytics(): Promise<ApplicationAnalytics> {
  const [total, statusGroups] = await Promise.all([
    prisma.application.count(),
    prisma.application.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const byStatus: Record<string, number> = {
    APPLIED: 0,
    SCREENING: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
  };

  statusGroups.forEach((group) => {
    byStatus[group.status] = group._count;
  });

  return { total, byStatus };
}

/**
 * Get company statistics
 */
async function getCompanyAnalytics(): Promise<CompanyAnalytics> {
  const total = await prisma.company.count();
  return { total };
}

/**
 * Get recently created users
 */
async function getRecentUsers(limit: number): Promise<RecentUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: limit,
  });

  return users as RecentUser[];
}

/**
 * Get recently created jobs
 */
async function getRecentJobs(limit: number): Promise<RecentJob[]> {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      recruiter: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
    take: limit,
  });

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    recruiter: {
      name: job.recruiter.name,
    },
    createdAt: job.createdAt,
  }));
}

/**
 * Get recently created applications
 */
async function getRecentApplications(limit: number): Promise<RecentApplication[]> {
  const apps = await prisma.application.findMany({
    select: {
      id: true,
      status: true,
      appliedAt: true,
      candidate: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      job: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" as const },
    take: limit,
  });

  return apps.map((app) => ({
    id: app.id,
    status: app.status,
    appliedAt: app.appliedAt,
    candidate: {
      name: app.candidate.user.name,
    },
    job: {
      title: app.job?.title || "Unknown",
    },
  }));
}