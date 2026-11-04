-- CreateTable
CREATE TABLE "subplots" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "area_m2" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subplots_pkey" PRIMARY KEY ("id")
);
