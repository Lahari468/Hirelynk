import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../types/index.js";
import { CreateCompanyRequest, UpdateCompanyRequest } from "../validators/companyValidator.js";

const prisma = new PrismaClient();

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  recruiterCount?: number;
  jobCount?: number;
}

/**
 * Create a company and associate it with the authenticated recruiter
 */
export const createCompany = async (
  recruiterId: string,
  data: CreateCompanyRequest
): Promise<CompanyData> => {
  // Normalize URLs
  const website = data.website ? data.website.trim() || null : null;
  const logoUrl = data.logoUrl ? data.logoUrl.trim() || null : null;

  // Use transaction to create company and update recruiter profile
  const result = await prisma.$transaction(async (tx) => {
    // Create company
    const company = await tx.company.create({
      data: {
        name: data.name,
        description: data.description || null,
        website,
        logoUrl,
        location: data.location || null,
      },
    });

    // Update recruiter profile to associate with company
    await tx.recruiterProfile.update({
      where: { userId: recruiterId },
      data: { companyId: company.id },
    });

    return company;
  });

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    website: result.website,
    logoUrl: result.logoUrl,
    location: result.location,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
};

/**
 * Get company associated with authenticated recruiter
 */
export const getRecruiterCompany = async (recruiterId: string): Promise<CompanyData> => {
  // Get recruiter profile first
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: recruiterId },
  });

  if (!recruiterProfile || !recruiterProfile.companyId) {
    throw new NotFoundError("No company associated with this recruiter");
  }

  // Get company
  const company = await prisma.company.findUnique({
    where: { id: recruiterProfile.companyId },
    include: {
      _count: {
        select: { jobs: true },
      },
    },
  });

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  return {
    id: company.id,
    name: company.name,
    description: company.description,
    website: company.website,
    logoUrl: company.logoUrl,
    location: company.location,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    jobCount: company._count.jobs,
  };
};

/**
 * Update company associated with authenticated recruiter
 */
export const updateRecruiterCompany = async (
  recruiterId: string,
  data: UpdateCompanyRequest
): Promise<CompanyData> => {
  // Get recruiter profile first to verify ownership
  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: recruiterId },
  });

  if (!recruiterProfile || !recruiterProfile.companyId) {
    throw new NotFoundError("No company associated with this recruiter");
  }

  // Normalize URLs
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.website !== undefined) updateData.website = data.website ? data.website.trim() || null : null;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl ? data.logoUrl.trim() || null : null;
  if (data.location !== undefined) updateData.location = data.location || null;

  // Update company
  const company = await prisma.company.update({
    where: { id: recruiterProfile.companyId },
    data: updateData,
    include: {
      _count: {
        select: { jobs: true },
      },
    },
  });

  return {
    id: company.id,
    name: company.name,
    description: company.description,
    website: company.website,
    logoUrl: company.logoUrl,
    location: company.location,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    jobCount: company._count.jobs,
  };
};

/**
 * Get company by ID (for admin)
 */
export const getCompanyById = async (companyId: string): Promise<CompanyData> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      _count: {
        select: { jobs: true, recruiters: true },
      },
    },
  });

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  return {
    id: company.id,
    name: company.name,
    description: company.description,
    website: company.website,
    logoUrl: company.logoUrl,
    location: company.location,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    recruiterCount: company._count.recruiters,
    jobCount: company._count.jobs,
  };
};