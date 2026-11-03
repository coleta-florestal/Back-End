/*
  Warnings:

  - Added the required column `target_trees` to the `subplots` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubPlotStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SyncSubPlotStatus" AS ENUM ('SYNCED', 'NOT_SYNCED');

-- AlterTable
ALTER TABLE "subplots" ADD COLUMN     "status" "SubPlotStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "sync_status" "SyncSubPlotStatus" NOT NULL DEFAULT 'NOT_SYNCED',
ADD COLUMN     "target_trees" INTEGER NOT NULL;
