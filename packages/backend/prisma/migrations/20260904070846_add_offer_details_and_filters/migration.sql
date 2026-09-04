-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EMPLOYMENT_CONTRACT', 'B2B', 'MANDATE_CONTRACT', 'CONTRACT_FOR_SPECIFIC_WORK', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "SeniorityLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'LEAD');

-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "contractType" "ContractType"[] DEFAULT ARRAY[]::"ContractType"[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "rate" TEXT,
ADD COLUMN     "remoteType" "RemoteType",
ADD COLUMN     "seniority" "SeniorityLevel",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
