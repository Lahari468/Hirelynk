-- DropForeignKey
ALTER TABLE "RecruiterProfile" DROP CONSTRAINT "RecruiterProfile_companyId_fkey";

-- AlterTable
ALTER TABLE "RecruiterProfile" ALTER COLUMN "companyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
