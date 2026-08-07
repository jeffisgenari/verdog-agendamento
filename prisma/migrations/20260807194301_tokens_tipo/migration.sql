-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('VERIFICACAO_EMAIL', 'REDEFINIR_SENHA');

-- AlterTable
ALTER TABLE "tokens_verificacao" ADD COLUMN     "tipo" "TipoToken" NOT NULL DEFAULT 'VERIFICACAO_EMAIL';
