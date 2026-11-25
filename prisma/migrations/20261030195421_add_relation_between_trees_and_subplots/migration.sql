/*
  Warnings:

  - Added the required column `sub_plot_id` to the `trees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trees" ADD COLUMN     "sub_plot_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "trees" ADD CONSTRAINT "trees_sub_plot_id_fkey" FOREIGN KEY ("sub_plot_id") REFERENCES "subplots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
