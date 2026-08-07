-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN     "clienteId" TEXT;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
