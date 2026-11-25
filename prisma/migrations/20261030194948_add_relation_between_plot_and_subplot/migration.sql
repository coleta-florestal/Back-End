/*
  Warnings:

  - Added the required column `plot_id` to the `subplots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subplots" ADD COLUMN     "plot_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "subplots" ADD CONSTRAINT "subplots_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
