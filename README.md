# Verdog Agendamento

Sistema de agendamento para passeadores, adestradores e hospedagem de pets.

## O que já está pronto

- Login e cadastro de verdade: e-mail/senha e Google (NextAuth), com conta
  de admin provisória separada
- Cada conta escolhe se é cliente ou profissional logo no primeiro acesso
- Home com filtros, cards padronizados (foto, local/zona, preço,
  profissional) e selo "+ Reservar"
- Cadastro de anúncio: fotos (até 8, comprimidas no navegador), local/zona,
  e disponibilidade — passeio/adestramento em horários fixos, hospedagem
  em diárias soltas escolhidas num calendário de verdade
- Reserva exige login, evita duplo agendamento do mesmo horário/diária e
  fica vinculada à conta do cliente
- Painel admin para aprovar/rejeitar anúncios
- "Meus pedidos" (cliente) e "Meus clientes" (profissional), com botão de
  WhatsApp — do profissional pro cliente sempre, e do cliente pro
  profissional só depois que o pagamento é confirmado
- Perfil público do profissional, avatar de usuário (upload ou vindo do
  Google)
- Banco de dados real (Postgres/Neon) conectado

## O que falta (próximos passos)

1. **Pagamento de verdade (Pagar.me)** — hoje a reserva fica "aguardando
   pagamento" pra sempre. Falta a chamada de cobrança e o webhook que
   confirma o pagamento (`app/api/bookings/route.ts` e
   `app/api/webhook-pagarme/route.ts` já têm os pontos marcados com `TODO`).
   Precisa de domínio público pro Pagar.me conseguir chamar o webhook, então
   depende do item 2.
2. **Colocar no ar (deploy)** — GitHub + Vercel, ver seção abaixo. Sem isso
   o site só existe no seu computador.
3. **Credenciais reais do Google** — pra ativar o botão "Login com Google"
   (Client ID/Secret no Google Cloud Console).
4. **Editar/excluir anúncio** — hoje só dá pra criar; não dá pra mudar
   fotos, preço ou adicionar mais horários depois de publicado.
5. **Cancelar agendamento** — e liberar o horário de volta pra outra
   pessoa reservar.
6. **Shopify App Proxy** — conectar `verdog.com.br/agendamento` a este
   projeto depois que ele estiver no ar.
7. Itens menores: recuperação de senha, verificação de e-mail,
   notificações automáticas (hoje é só WhatsApp manual), avaliações de
   profissionais.

## Como colocar no ar (passo a passo, sem precisar saber programar)

1. Crie uma conta gratuita em [neon.tech](https://neon.tech) ou
   [supabase.com](https://supabase.com) — isso te dá o banco de dados.
   Copie a "connection string" (uma URL que começa com `postgresql://`).
2. Crie uma conta em [github.com](https://github.com) e suba esta pasta
   como um repositório novo.
3. Crie uma conta em [vercel.com](https://vercel.com), conecte com o
   GitHub e importe o repositório. Nas configurações do projeto, adicione
   a variável de ambiente `DATABASE_URL` com o valor copiado no passo 1.
4. O Vercel builda e publica automaticamente. Toda vez que o código for
   atualizado no GitHub, o site atualiza sozinho.

Se preferir, posso te guiar em cada uma dessas contas quando chegar a hora.
