-- CreateEnum
CREATE TYPE "EquationType" AS ENUM ('SCHUMACHER_HALL', 'SPURR', 'HUSCH');

-- CreateTable
CREATE TABLE "volumetric_equations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model_type" "EquationType" NOT NULL,
    "beta0" DOUBLE PRECISION NOT NULL,
    "beta1" DOUBLE PRECISION NOT NULL,
    "beta2" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volumetric_equations_pkey" PRIMARY KEY ("id")
);
