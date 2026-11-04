/*
  Warnings:

  - You are about to drop the column `number` on the `trees` table. All the data in the column will be lost.
  - Added the required column `name` to the `trees` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "trees_sub_plot_id_number_key";

-- AlterTable
ALTER TABLE "trees" DROP COLUMN "number",
ADD COLUMN     "name" TEXT NOT NULL;
