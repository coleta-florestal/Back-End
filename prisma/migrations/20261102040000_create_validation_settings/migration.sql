-- CreateTable
CREATE TABLE "validation_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "min_dap_cm" DOUBLE PRECISION NOT NULL,
    "max_dap_cm" DOUBLE PRECISION NOT NULL,
    "min_height_m" DOUBLE PRECISION NOT NULL,
    "max_height_m" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "validation_settings_singleton" CHECK ("id" = 1),
    CONSTRAINT "validation_settings_dap_range" CHECK ("min_dap_cm" > 0 AND "max_dap_cm" > "min_dap_cm"),
    CONSTRAINT "validation_settings_height_range" CHECK ("min_height_m" > 0 AND "max_height_m" > "min_height_m")
);
