# Verdog Agendamento

Sistema de agendamento para passeadores, adestradores e hospedagem de pets.

## O que já está pronto

- **No ar**: github.com/jeffisgenari/verdog-agendamento → deploy automático
  no Vercel (verdog-agendamento.vercel.app), banco Postgres real (Neon)
- Login e cadastro de verdade: e-mail/senha e Google (com vínculo automático
  se a pessoa já tinha conta por senha), mais conta de admin provisória
- Cada conta escolhe se é cliente ou profissional logo no primeiro acesso
- Home com filtros, cards padronizados (foto, local/zona, preço,
  profissional) e selo "+ Reservar"
- Cadastro de anúncio: fotos (até 8, comprimidas no navegador), local/zona,
  local da hospedagem em texto livre, e disponibilidade — passeio/adestramento
  em horários fixos, hospedagem em diárias soltas escolhidas num calendário
  de verdade. Todos os campos são obrigatórios.
- **Meus anúncios**: profissional edita (título, descrição, preço, fotos,
  horários) sem precisar de aprovação de novo, e pausa/retoma a qualquer
  momento — anúncio pausado some da home na hora
- Reserva exige login, evita duplo agendamento do mesmo horário/diária e
  fica vinculada à conta do cliente
- Painel admin para aprovar/rejeitar anúncios (rota protegida, só admin)
- "Meus pedidos" (cliente) e "Meus clientes" (profissional), com botão de
  WhatsApp — do profissional pro cliente sempre, e do cliente pro
  profissional só depois que o pagamento é confirmado
- Perfil público do profissional, avatar de usuário (upload ou vindo do
  Google), cabeçalho padrão (logo clicável + menu) em toda página
- Favicon configurado

## O que falta (próximos passos)

1. **Pagamento de verdade (Pagar.me)** — a peça que falta pra fechar o
   ciclo. Hoje a reserva fica "aguardando pagamento" pra sempre. Falta a
   chamada de cobrança e o webhook que confirma o pagamento
   (`app/api/bookings/route.ts` e `app/api/webhook-pagarme/route.ts` já têm
   os pontos marcados com `TODO`). Já temos domínio público, então esse é
   o único bloqueio real agora.
2. **Cancelar agendamento** — hoje não existe essa opção nem pro cliente
   nem pro profissional; e ao cancelar, teria que liberar o horário de
   volta pra outra pessoa reservar.
3. **Shopify App Proxy** — conectar `verdog.com.br/agendamento` a este
   projeto.
4. Itens menores: recuperação de senha, verificação de e-mail,
   notificações automáticas (hoje é só WhatsApp manual), avaliações de
   profissionais, armazenamento de fotos num serviço de verdade (hoje
   ficam comprimidas dentro do próprio banco — funciona, mas não escala
   indefinidamente).

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
