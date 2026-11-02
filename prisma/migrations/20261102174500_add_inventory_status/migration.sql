-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'FINISHED');
CREATE TYPE "SubPlotStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'CLOSED');

-- AlterTable
ALTER TABLE "plots" ADD COLUMN "status" "PlotStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "subplots" ADD COLUMN "status" "SubPlotStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- Preserve the progress of collections that already have measured trees.
UPDATE "subplots" AS subplot
SET "status" = 'IN_PROGRESS'
WHERE EXISTS (
    SELECT 1 FROM "trees" AS tree WHERE tree."sub_plot_id" = subplot."id"
);

UPDATE "plots" AS plot
SET "status" = 'IN_PROGRESS'
WHERE EXISTS (
    SELECT 1 FROM "subplots" AS subplot
    WHERE subplot."plot_id" = plot."id" AND subplot."status" = 'IN_PROGRESS'
);
