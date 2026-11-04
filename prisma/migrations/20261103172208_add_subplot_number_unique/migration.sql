/*
  Warnings:

  - A unique constraint covering the columns `[plot_id,number]` on the table `subplots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subplots_plot_id_number_key" ON "subplots"("plot_id", "number");
