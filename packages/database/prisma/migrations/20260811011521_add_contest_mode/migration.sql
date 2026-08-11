-- CreateEnum
CREATE TYPE "ContestMode" AS ENUM ('CONTEST', 'PRACTICE');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "mode" "ContestMode" NOT NULL DEFAULT 'CONTEST';
