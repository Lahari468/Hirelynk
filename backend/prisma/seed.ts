import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Demo password for local development only
const DEMO_PASSWORD = "HireLynkDemo123!";
const DEMO_PASSWORD_SALT_ROUNDS = 12;

async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, DEMO_PASSWORD_SALT_ROUNDS);
}

async function main(): Promise<void> {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidateSkill.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.job.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Generate password hash once
  const passwordHash = await generatePasswordHash(DEMO_PASSWORD);

  // ============================================================================
  // CREATE USERS
  // ============================================================================

  // Admin
  const _admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@hirelynk.demo",
      passwordHash: passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  // Recruiters
  const recruiter1 = await prisma.user.create({
    data: {
      name: "Sarah Johnson",
      email: "recruiter1@hirelynk.demo",
      passwordHash: passwordHash,
      role: "RECRUITER",
      isActive: true,
    },
  });

  const recruiter2 = await prisma.user.create({
    data: {
      name: "Michael Chen",
      email: "recruiter2@hirelynk.demo",
      passwordHash: passwordHash,
      role: "RECRUITER",
      isActive: true,
    },
  });

  // Candidates
  const candidate1 = await prisma.user.create({
    data: {
      name: "Alice Williams",
      email: "candidate1@hirelynk.demo",
      passwordHash: passwordHash,
      role: "CANDIDATE",
      isActive: true,
    },
  });

  const candidate2 = await prisma.user.create({
    data: {
      name: "Bob Martinez",
      email: "candidate2@hirelynk.demo",
      passwordHash: passwordHash,
      role: "CANDIDATE",
      isActive: true,
    },
  });

  const candidate3 = await prisma.user.create({
    data: {
      name: "Carol Davis",
      email: "candidate3@hirelynk.demo",
      passwordHash: passwordHash,
      role: "CANDIDATE",
      isActive: true,
    },
  });

  const candidate4 = await prisma.user.create({
    data: {
      name: "David Lee",
      email: "candidate4@hirelynk.demo",
      passwordHash: passwordHash,
      role: "CANDIDATE",
      isActive: true,
    },
  });

  const candidate5 = await prisma.user.create({
    data: {
      name: "Emma Wilson",
      email: "candidate5@hirelynk.demo",
      passwordHash: passwordHash,
      role: "CANDIDATE",
      isActive: true,
    },
  });

  console.log("✅ Created 8 users (1 admin, 2 recruiters, 5 candidates)");

  // ============================================================================
  // CREATE COMPANIES
  // ============================================================================

  const company1 = await prisma.company.create({
    data: {
      name: "TechCorp Solutions",
      description: "Leading software development company",
      website: "https://techcorp.demo",
      location: "San Francisco, CA",
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "DataFlow Analytics",
      description: "Data science and analytics platform",
      website: "https://dataflow.demo",
      location: "New York, NY",
    },
  });

  console.log("✅ Created 2 companies");

  // ============================================================================
  // CREATE CANDIDATE PROFILES
  // ============================================================================

  const profile1 = await prisma.candidateProfile.create({
    data: {
      userId: candidate1.id,
      headline: "Full Stack Developer",
      bio: "Passionate about building scalable web applications",
      phone: "+1-555-0101",
      location: "San Francisco, CA",
      experienceYears: 5,
      education: "BS Computer Science",
      linkedinUrl: "https://linkedin.com/in/alice.demo",
      githubUrl: "https://github.com/alice.demo",
    },
  });

  const profile2 = await prisma.candidateProfile.create({
    data: {
      userId: candidate2.id,
      headline: "Senior Backend Engineer",
      bio: "Experienced in microservices and distributed systems",
      phone: "+1-555-0102",
      location: "New York, NY",
      experienceYears: 8,
      education: "BS Information Technology",
      linkedinUrl: "https://linkedin.com/in/bob.demo",
      githubUrl: "https://github.com/bob.demo",
    },
  });

  const profile3 = await prisma.candidateProfile.create({
    data: {
      userId: candidate3.id,
      headline: "Product Manager",
      bio: "Product strategy and user experience focused",
      phone: "+1-555-0103",
      location: "Austin, TX",
      experienceYears: 6,
      education: "MBA",
    },
  });

  const profile4 = await prisma.candidateProfile.create({
    data: {
      userId: candidate4.id,
      headline: "Data Scientist",
      bio: "Machine learning and statistical analysis",
      phone: "+1-555-0104",
      location: "Seattle, WA",
      experienceYears: 4,
      education: "MS Data Science",
    },
  });

  const profile5 = await prisma.candidateProfile.create({
    data: {
      userId: candidate5.id,
      headline: "UI/UX Designer",
      bio: "Designing beautiful and functional interfaces",
      phone: "+1-555-0105",
      location: "Los Angeles, CA",
      experienceYears: 3,
      education: "BFA Graphic Design",
    },
  });

  console.log("✅ Created 5 candidate profiles");

  // ============================================================================
  // CREATE RECRUITER PROFILES
  // ============================================================================

  await prisma.recruiterProfile.create({
    data: {
      userId: recruiter1.id,
      companyId: company1.id,
      jobTitle: "Head of Recruiting",
    },
  });

  await prisma.recruiterProfile.create({
    data: {
      userId: recruiter2.id,
      companyId: company2.id,
      jobTitle: "Talent Acquisition Manager",
    },
  });

  console.log("✅ Created 2 recruiter profiles");

  // ============================================================================
  // CREATE SKILLS
  // ============================================================================

  const skills = await Promise.all([
    prisma.skill.create({ data: { name: "TypeScript" } }),
    prisma.skill.create({ data: { name: "React" } }),
    prisma.skill.create({ data: { name: "Node.js" } }),
    prisma.skill.create({ data: { name: "PostgreSQL" } }),
    prisma.skill.create({ data: { name: "Python" } }),
    prisma.skill.create({ data: { name: "Machine Learning" } }),
    prisma.skill.create({ data: { name: "Product Strategy" } }),
    prisma.skill.create({ data: { name: "UI/UX Design" } }),
  ]);

  console.log("✅ Created 8 skills");

  // ============================================================================
  // CREATE CANDIDATE SKILLS
  // ============================================================================

  // Alice: TypeScript, React, Node.js
  await prisma.candidateSkill.create({
    data: { candidateId: profile1.id, skillId: skills[0].id },
  });
  await prisma.candidateSkill.create({
    data: { candidateId: profile1.id, skillId: skills[1].id },
  });
  await prisma.candidateSkill.create({
    data: { candidateId: profile1.id, skillId: skills[2].id },
  });

  // Bob: Node.js, PostgreSQL, TypeScript
  await prisma.candidateSkill.create({
    data: { candidateId: profile2.id, skillId: skills[2].id },
  });
  await prisma.candidateSkill.create({
    data: { candidateId: profile2.id, skillId: skills[3].id },
  });
  await prisma.candidateSkill.create({
    data: { candidateId: profile2.id, skillId: skills[0].id },
  });

  // Carol: Product Strategy
  await prisma.candidateSkill.create({
    data: { candidateId: profile3.id, skillId: skills[6].id },
  });

  // David: Python, Machine Learning
  await prisma.candidateSkill.create({
    data: { candidateId: profile4.id, skillId: skills[4].id },
  });
  await prisma.candidateSkill.create({
    data: { candidateId: profile4.id, skillId: skills[5].id },
  });

  // Emma: UI/UX Design
  await prisma.candidateSkill.create({
    data: { candidateId: profile5.id, skillId: skills[7].id },
  });

  console.log("✅ Created candidate skills");

  // ============================================================================
  // CREATE JOBS
  // ============================================================================

  const job1 = await prisma.job.create({
    data: {
      companyId: company1.id,
      recruiterId: recruiter1.id,
      title: "Senior Full Stack Developer",
      description:
        "We are looking for an experienced full stack developer to join our team",
      location: "San Francisco, CA",
      employmentType: "FULL_TIME",
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: "150000",
      salaryMax: "200000",
      status: "OPEN",
    },
  });

  const job2 = await prisma.job.create({
    data: {
      companyId: company1.id,
      recruiterId: recruiter1.id,
      title: "Backend Engineer",
      description: "Join our backend team and work on scalable systems",
      location: "San Francisco, CA",
      employmentType: "FULL_TIME",
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: "130000",
      salaryMax: "170000",
      status: "OPEN",
    },
  });

  const job3 = await prisma.job.create({
    data: {
      companyId: company2.id,
      recruiterId: recruiter2.id,
      title: "Data Scientist",
      description: "Build machine learning models for data analysis",
      location: "New York, NY",
      employmentType: "FULL_TIME",
      experienceMin: 3,
      experienceMax: 8,
      salaryMin: "140000",
      salaryMax: "190000",
      status: "OPEN",
    },
  });

  const job4 = await prisma.job.create({
    data: {
      companyId: company2.id,
      recruiterId: recruiter2.id,
      title: "Product Manager",
      description: "Lead product strategy and roadmap",
      location: "New York, NY",
      employmentType: "FULL_TIME",
      experienceMin: 5,
      experienceMax: 12,
      salaryMin: "160000",
      salaryMax: "210000",
      status: "OPEN",
    },
  });

  const job5 = await prisma.job.create({
    data: {
      companyId: company1.id,
      recruiterId: recruiter1.id,
      title: "Frontend Engineer",
      description: "Build beautiful user interfaces with React",
      location: "San Francisco, CA",
      employmentType: "FULL_TIME",
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: "120000",
      salaryMax: "160000",
      status: "OPEN",
    },
  });

  console.log("✅ Created 5 jobs");

  // ============================================================================
  // CREATE JOB SKILLS
  // ============================================================================

  // Job 1: Senior Full Stack - TypeScript, React, Node.js, PostgreSQL
  await prisma.jobSkill.create({ data: { jobId: job1.id, skillId: skills[0].id } });
  await prisma.jobSkill.create({ data: { jobId: job1.id, skillId: skills[1].id } });
  await prisma.jobSkill.create({ data: { jobId: job1.id, skillId: skills[2].id } });
  await prisma.jobSkill.create({ data: { jobId: job1.id, skillId: skills[3].id } });

  // Job 2: Backend - Node.js, PostgreSQL, TypeScript
  await prisma.jobSkill.create({ data: { jobId: job2.id, skillId: skills[2].id } });
  await prisma.jobSkill.create({ data: { jobId: job2.id, skillId: skills[3].id } });
  await prisma.jobSkill.create({ data: { jobId: job2.id, skillId: skills[0].id } });

  // Job 3: Data Scientist - Python, Machine Learning
  await prisma.jobSkill.create({ data: { jobId: job3.id, skillId: skills[4].id } });
  await prisma.jobSkill.create({ data: { jobId: job3.id, skillId: skills[5].id } });

  // Job 4: Product Manager - Product Strategy
  await prisma.jobSkill.create({ data: { jobId: job4.id, skillId: skills[6].id } });

  // Job 5: Frontend - React, TypeScript
  await prisma.jobSkill.create({ data: { jobId: job5.id, skillId: skills[1].id } });
  await prisma.jobSkill.create({ data: { jobId: job5.id, skillId: skills[0].id } });

  console.log("✅ Created job skills");

  // ============================================================================
  // CREATE RESUMES
  // ============================================================================

  const resume1 = await prisma.resume.create({
    data: {
      candidateId: profile1.id,
      fileName: "Alice_Williams_Resume.pdf",
      fileUrl: "https://cloudinary.demo/alice_resume",
      cloudinaryPublicId: "hirelynk/alice_resume",
    },
  });

  const resume2 = await prisma.resume.create({
    data: {
      candidateId: profile2.id,
      fileName: "Bob_Martinez_Resume.pdf",
      fileUrl: "https://cloudinary.demo/bob_resume",
      cloudinaryPublicId: "hirelynk/bob_resume",
    },
  });

  const resume3 = await prisma.resume.create({
    data: {
      candidateId: profile3.id,
      fileName: "Carol_Davis_Resume.pdf",
      fileUrl: "https://cloudinary.demo/carol_resume",
      cloudinaryPublicId: "hirelynk/carol_resume",
    },
  });

  console.log("✅ Created 3 resumes");

  // ============================================================================
  // CREATE APPLICATIONS
  // ============================================================================

  const app1 = await prisma.application.create({
    data: {
      candidateId: profile1.id,
      jobId: job1.id,
      resumeId: resume1.id,
      coverLetter:
        "I am very interested in this Senior Full Stack position...",
      status: "SCREENING",
    },
  });

  const _app2 = await prisma.application.create({
    data: {
      candidateId: profile1.id,
      jobId: job5.id,
      resumeId: resume1.id,
      status: "APPLIED",
    },
  });

  const app3 = await prisma.application.create({
    data: {
      candidateId: profile2.id,
      jobId: job2.id,
      resumeId: resume2.id,
      coverLetter:
        "With 8 years of backend experience, I'm excited about this role...",
      status: "INTERVIEW",
    },
  });

  const _app4 = await prisma.application.create({
    data: {
      candidateId: profile3.id,
      jobId: job4.id,
      resumeId: resume3.id,
      status: "SCREENING",
    },
  });

  const _app5 = await prisma.application.create({
    data: {
      candidateId: profile4.id,
      jobId: job3.id,
      status: "APPLIED",
    },
  });

  const _app6 = await prisma.application.create({
    data: {
      candidateId: profile5.id,
      jobId: job5.id,
      status: "APPLIED",
    },
  });

  console.log("✅ Created 6 applications");

  // ============================================================================
  // CREATE APPLICATION STATUS HISTORY
  // ============================================================================

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app1.id,
      newStatus: "APPLIED",
      changedBy: recruiter1.id,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app1.id,
      oldStatus: "APPLIED",
      newStatus: "SCREENING",
      changedBy: recruiter1.id,
      comment: "Moved to screening based on experience",
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app3.id,
      newStatus: "APPLIED",
      changedBy: recruiter1.id,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app3.id,
      oldStatus: "APPLIED",
      newStatus: "SCREENING",
      changedBy: recruiter1.id,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: app3.id,
      oldStatus: "SCREENING",
      newStatus: "INTERVIEW",
      changedBy: recruiter1.id,
      comment: "Scheduled interview",
    },
  });

  console.log("✅ Created application status histories");

  // ============================================================================
  // CREATE INTERVIEWS
  // ============================================================================

  const interviewDate = new Date();
  interviewDate.setDate(interviewDate.getDate() + 7);

  await prisma.interview.create({
    data: {
      applicationId: app3.id,
      scheduledBy: recruiter1.id,
      interviewType: "TECHNICAL",
      scheduledAt: interviewDate,
      duration: 60,
      meetingLink: "https://zoom.demo/interview123",
      status: "SCHEDULED",
    },
  });

  const interview2Date = new Date();
  interview2Date.setDate(interview2Date.getDate() + 14);

  await prisma.interview.create({
    data: {
      applicationId: app1.id,
      scheduledBy: recruiter1.id,
      interviewType: "HR",
      scheduledAt: interview2Date,
      duration: 45,
      meetingLink: "https://zoom.demo/interview456",
      status: "SCHEDULED",
    },
  });

  console.log("✅ Created 2 interviews");

  // ============================================================================
  // CREATE SAVED JOBS
  // ============================================================================

  await prisma.savedJob.create({
    data: { candidateId: profile1.id, jobId: job2.id },
  });

  await prisma.savedJob.create({
    data: { candidateId: profile1.id, jobId: job3.id },
  });

  await prisma.savedJob.create({
    data: { candidateId: profile2.id, jobId: job1.id },
  });

  await prisma.savedJob.create({
    data: { candidateId: profile4.id, jobId: job2.id },
  });

  console.log("✅ Created 4 saved jobs");

  // ============================================================================
  // CREATE NOTIFICATIONS
  // ============================================================================

  await prisma.notification.create({
    data: {
      userId: candidate1.id,
      type: "APPLICATION_STATUS_CHANGED",
      title: "Application Status Updated",
      message:
        "Your application for Senior Full Stack Developer has moved to Screening",
    },
  });

  await prisma.notification.create({
    data: {
      userId: candidate2.id,
      type: "INTERVIEW_SCHEDULED",
      title: "Interview Scheduled",
      message:
        "Your interview for Backend Engineer has been scheduled for next week",
    },
  });

  await prisma.notification.create({
    data: {
      userId: candidate1.id,
      type: "NEW_APPLICATION",
      title: "New Job Posted",
      message: "A new Frontend Engineer position has been posted",
    },
  });

  console.log("✅ Created 3 notifications");

  // ============================================================================
  // CREATE AUDIT LOGS
  // ============================================================================

  await prisma.auditLog.create({
    data: {
      userId: recruiter1.id,
      action: "JOB_CREATED",
      entityType: "Job",
      entityId: job1.id,
      metadata: {
        title: job1.title,
        company: company1.name,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: recruiter1.id,
      action: "JOB_PUBLISHED",
      entityType: "Job",
      entityId: job1.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: recruiter1.id,
      action: "APPLICATION_CREATED",
      entityType: "Application",
      entityId: app1.id,
      metadata: {
        candidate: profile1.id,
        job: job1.id,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: recruiter1.id,
      action: "APPLICATION_STATUS_CHANGED",
      entityType: "Application",
      entityId: app1.id,
      metadata: {
        oldStatus: "APPLIED",
        newStatus: "SCREENING",
      },
    },
  });

  console.log("✅ Created 4 audit logs");

  console.log("\n✨ Database seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - 8 Users (1 admin, 2 recruiters, 5 candidates)`);
  console.log(`   - 2 Companies`);
  console.log(`   - 5 Candidate Profiles`);
  console.log(`   - 2 Recruiter Profiles`);
  console.log(`   - 5 Jobs`);
  console.log(`   - 8 Skills`);
  console.log(`   - 6 Applications`);
  console.log(`   - 5 Application Status Histories`);
  console.log(`   - 2 Interviews`);
  console.log(`   - 4 Saved Jobs`);
  console.log(`   - 3 Notifications`);
  console.log(`   - 4 Audit Logs`);
  console.log(`\n🔐 DEMO CREDENTIALS:`);
  console.log(`   All demo accounts use password: ${DEMO_PASSWORD}`);
  console.log(`   Email format: role@hirelynk.demo`);
  console.log(`   Examples: admin@hirelynk.demo, recruiter1@hirelynk.demo, candidate1@hirelynk.demo`);
  console.log(`\n⚠️  IMPORTANT: This is for LOCAL DEVELOPMENT ONLY`);
  console.log(`   - Demo password is NOT for production`);
  console.log(`   - All demo data is sample/placeholder data`);
  console.log(`   - Do NOT use these credentials in production`);
}

main()
  .catch((e: unknown) => {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("❌ Seed failed:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });