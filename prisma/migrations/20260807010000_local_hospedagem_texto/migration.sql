-- "localHospedagem" deixa de ser um enum fixo (2 opções) e vira texto livre,
-- pro profissional digitar onde é a hospedagem. Converte o valor existente
-- pro texto equivalente do enum (preserva os dados de teste).
ALTER TABLE "Anuncio" ALTER COLUMN "localHospedagem" TYPE TEXT USING "localHospedagem"::TEXT;
DROP TYPE "LocalHospedagem";
