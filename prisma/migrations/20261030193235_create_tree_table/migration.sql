-- CreateTable
CREATE TABLE "trees" (
    "id" TEXT NOT NULL,
    "number" INTEGER,
    "diameter_dap_cm" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "condition" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trees_pkey" PRIMARY KEY ("id")
);
