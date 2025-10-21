/*
  Warnings:

  - You are about to drop the `Instructor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_authorId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slug" TEXT;

-- DropTable
DROP TABLE "Instructor";

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
