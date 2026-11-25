/*
  Warnings:

  - You are about to drop the column `sync_status` on the `subplots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subplots" DROP COLUMN "sync_status";

-- DropEnum
DROP TYPE "SyncSubPlotStatus";
