-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area_ha" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);
