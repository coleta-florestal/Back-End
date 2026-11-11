-- Seed default limits (admins can adjust them later)
INSERT INTO "validation_settings" ("id", "min_dap_cm", "max_dap_cm", "min_height_m", "max_height_m", "updated_at")
VALUES (1, 5, 300, 1, 60, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
