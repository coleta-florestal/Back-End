/*
  Warnings:

  - You are about to drop the column `number` on the `subplots` table. All the data in the column will be lost.
  - Added the required column `name` to the `subplots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "subplots_plot_id_number_key";

-- AlterTable
ALTER TABLE "subplots" DROP COLUMN "number",
ADD COLUMN     "name" TEXT NOT NULL;
