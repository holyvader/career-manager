-- CreateEnum
CREATE TYPE "JobOfferStatus" AS ENUM ('STARTED', 'IN_PROGRESS', 'HIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "status" "JobOfferStatus" NOT NULL DEFAULT 'STARTED';
