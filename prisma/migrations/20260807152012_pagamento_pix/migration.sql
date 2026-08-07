-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN     "clienteCpf" TEXT;

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "pixExpiraEm" TIMESTAMP(3),
ADD COLUMN     "pixQrCode" TEXT,
ADD COLUMN     "pixQrCodeUrl" TEXT;
