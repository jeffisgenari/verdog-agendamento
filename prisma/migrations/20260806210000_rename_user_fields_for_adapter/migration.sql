-- Renomeia "nome" -> "name" e "avatarUrl" -> "image" (nomes que o adapter do
-- NextAuth espera), e adiciona "emailVerified". Usa RENAME COLUMN em vez de
-- dropar + criar pra não perder dados já gravados.
ALTER TABLE "usuarios" RENAME COLUMN "nome" TO "name";
ALTER TABLE "usuarios" RENAME COLUMN "avatarUrl" TO "image";
ALTER TABLE "usuarios" ADD COLUMN "emailVerified" TIMESTAMP(3);
