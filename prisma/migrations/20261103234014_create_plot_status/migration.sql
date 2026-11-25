-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'FINISHED');

-- AlterTable
ALTER TABLE "plots" ADD COLUMN     "status" "PlotStatus" NOT NULL DEFAULT 'NOT_STARTED';
