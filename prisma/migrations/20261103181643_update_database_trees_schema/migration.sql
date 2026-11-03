/*
  Warnings:

  - You are about to drop the column `condition` on the `trees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sub_plot_id,number]` on the table `trees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `trees` table without a default value. This is not possible if the table is not empty.
  - Made the column `number` on table `trees` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TreeQuality" AS ENUM ('NORMAL', 'BIFURCADA', 'DOMINADA', 'MORTA', 'QUEBRADA', 'PRAGA_DOENCA');

-- AlterTable
ALTER TABLE "trees" DROP COLUMN "condition",
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "quality" "TreeQuality" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "number" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "trees_sub_plot_id_number_key" ON "trees"("sub_plot_id", "number");
