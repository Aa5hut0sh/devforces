/*
  Warnings:

  - You are about to drop the column `boilerplateId` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `submission` on the `Submission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contestId,index]` on the table `ContestToChallengeMapping` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `editableFiles` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `boilerplateId` to the `Contest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `files` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "boilerplateId",
ADD COLUMN     "editableFiles" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "boilerplateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "submission",
ADD COLUMN     "files" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ContestToChallengeMapping_contestId_index_key" ON "ContestToChallengeMapping"("contestId", "index");
