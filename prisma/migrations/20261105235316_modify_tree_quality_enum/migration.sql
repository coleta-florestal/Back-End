/*
  Warnings:

  - The values [BIFURCADA,DOMINADA,PRAGA_DOENCA] on the enum `TreeQuality` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TreeQuality_new" AS ENUM ('NORMAL', 'BIFURCADA_ACIMA_DE_1_3M', 'BIFURCADA_ABAIXO_DE_1_3M', 'INCLINADA', 'MORTA', 'FALHA', 'PROBLEMAS_FITOSSANITARIOS', 'QUEBRADA', 'OUTRO');
ALTER TABLE "public"."trees" ALTER COLUMN "quality" DROP DEFAULT;
ALTER TABLE "trees" ALTER COLUMN "quality" TYPE "TreeQuality_new" USING (
  CASE "quality"::text
    WHEN 'BIFURCADA' THEN 'BIFURCADA_ACIMA_DE_1_3M'
    WHEN 'DOMINADA' THEN 'OUTRO'
    WHEN 'PRAGA_DOENCA' THEN 'PROBLEMAS_FITOSSANITARIOS'
    ELSE "quality"::text
  END::"TreeQuality_new"
);
ALTER TYPE "TreeQuality" RENAME TO "TreeQuality_old";
ALTER TYPE "TreeQuality_new" RENAME TO "TreeQuality";
DROP TYPE "public"."TreeQuality_old";
ALTER TABLE "trees" ALTER COLUMN "quality" SET DEFAULT 'NORMAL';
COMMIT;
