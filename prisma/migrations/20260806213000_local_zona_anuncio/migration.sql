-- Adiciona local/zona ao Anuncio. Usa um valor padrão só pra preencher
-- linhas já existentes (anúncios de teste) e depois remove o default, pra
-- obrigar todo anúncio novo a informar isso de verdade.
CREATE TYPE "ZonaAnuncio" AS ENUM ('NORTE', 'SUL', 'LESTE', 'OESTE', 'CENTRO');

ALTER TABLE "Anuncio" ADD COLUMN "local" TEXT NOT NULL DEFAULT 'A definir';
ALTER TABLE "Anuncio" ADD COLUMN "zona" "ZonaAnuncio" NOT NULL DEFAULT 'CENTRO';

ALTER TABLE "Anuncio" ALTER COLUMN "local" DROP DEFAULT;
ALTER TABLE "Anuncio" ALTER COLUMN "zona" DROP DEFAULT;
