/*
  Warnings:

  - Added the required column `farm_id` to the `plots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plots" ADD COLUMN     "farm_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
