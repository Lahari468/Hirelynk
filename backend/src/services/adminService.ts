import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CompanyListItem {
  id: string;
  name: string;
  location: string | null;
  recruiterCount: number;
  jobCount: number;
  createdAt: Date;
}

interface RecruiterListItem {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  jobTitle: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
}

/**
 * Get paginated list of companies with search
 */
export const listCompanies = async (
  params: PaginationParams
): Promise<PaginatedResponse<CompanyListItem>> => {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  // Build where clause for search
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { location: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Get total count
  const total = await prisma.company.count({ where });

  // Get companies
  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      location: true,
      createdAt: true,
      _count: {
        select: {
          recruiters: true,
          jobs: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc" as const,
    },
  });

  const items: CompanyListItem[] = companies.map((company) => ({
    id: company.id,
    name: company.name,
    location: company.location,
    recruiterCount: company._count.recruiters,
    jobCount: company._count.jobs,
    createdAt: company.createdAt,
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Get paginated list of recruiters with search
 */
export const listRecruiters = async (
  params: PaginationParams
): Promise<PaginatedResponse<RecruiterListItem>> => {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  // Build where clause for search
  const where = search
    ? {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { company: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  // Get total count
  const total = await prisma.recruiterProfile.count({ where });

  // Get recruiters
  const recruiters = await prisma.recruiterProfile.findMany({
    where,
    select: {
      id: true,
      userId: true,
      jobTitle: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc" as const,
    },
  });

  const items: RecruiterListItem[] = recruiters.map((recruiter) => ({
    id: recruiter.id,
    userId: recruiter.userId,
    user: recruiter.user,
    jobTitle: recruiter.jobTitle,
    company: recruiter.company,
    createdAt: recruiter.createdAt,
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};