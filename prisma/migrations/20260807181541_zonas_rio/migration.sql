-- Remove "LESTE" do enum ZonaAnuncio — não existe Zona Leste no Rio de
-- Janeiro (é divisão de São Paulo). Nenhum anúncio usava esse valor.
BEGIN;
CREATE TYPE "ZonaAnuncio_new" AS ENUM ('NORTE', 'SUL', 'OESTE', 'CENTRO');
ALTER TABLE "Anuncio" ALTER COLUMN "zona" TYPE "ZonaAnuncio_new" USING ("zona"::text::"ZonaAnuncio_new");
ALTER TYPE "ZonaAnuncio" RENAME TO "ZonaAnuncio_old";
ALTER TYPE "ZonaAnuncio_new" RENAME TO "ZonaAnuncio";
DROP TYPE "ZonaAnuncio_old";
COMMIT;
