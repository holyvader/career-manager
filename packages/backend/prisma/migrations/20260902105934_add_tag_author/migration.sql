-- DropIndex
DROP INDEX "Tag_name_key";

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "authorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_authorId_name_key" ON "Tag"("authorId", "name");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
