/*
  Warnings:

  - Made the column `area_ha` on table `plots` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "plots" ALTER COLUMN "area_ha" SET NOT NULL;
