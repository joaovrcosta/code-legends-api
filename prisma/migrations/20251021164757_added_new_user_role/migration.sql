/*
  Warnings:

  - You are about to drop the column `authorId` on the `Course` table. All the data in the column will be lost.
  - Added the required column `instructorId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INSTRUCTOR', 'ADMIN', 'STUDENT');

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_authorId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "authorId",
ADD COLUMN     "instructorId" TEXT NOT NULL,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT';

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
