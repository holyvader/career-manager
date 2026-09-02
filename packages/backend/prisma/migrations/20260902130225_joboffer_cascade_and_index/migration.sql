-- DropForeignKey
ALTER TABLE "JobOffer" DROP CONSTRAINT "JobOffer_participantId_fkey";

-- CreateIndex
CREATE INDEX "JobOffer_participantId_idx" ON "JobOffer"("participantId");

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
