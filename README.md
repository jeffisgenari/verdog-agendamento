# Verdog Agendamento

Marketplace de agendamento para serviços pet — passeio, adestramento e
hospedagem — com pagamento via Pix integrado.

🔗 **No ar:** [verdog-agendamento.vercel.app](https://verdog-agendamento.vercel.app)

## O que é

O Verdog Agendamento conecta tutores de pets a profissionais que oferecem
passeio, adestramento ou hospedagem. Profissionais anunciam seus serviços
com fotos, preço e horários disponíveis; clientes encontram, reservam e
pagam tudo dentro do site — sem precisar trocar mensagem só pra saber se
tem horário livre.

## Funcionalidades

### Para clientes

- Busca de serviços por tipo (passeio, adestramento, hospedagem) e zona da
  cidade
- Reserva com escolha de horário exato (passeio/adestramento) ou período
  de diárias num calendário (hospedagem) — sem risco de dois clientes
  pegarem o mesmo horário
- Pagamento via Pix na hora, com confirmação automática assim que o
  pagamento cai — sem precisar atualizar a página
- Se sair da tela antes de pagar, o botão "Pagar agora" em "Minhas
  reservas" reabre o mesmo QR Code
- Cancelamento de reservas ainda não pagas; reservas já pagas passam pelo
  suporte via WhatsApp (por causa do estorno)
- Cadastro com CPF (agiliza o pagamento Pix), verificação de e-mail e
  recuperação de senha
- Notificação no app quando um pagamento é confirmado
- Contato direto com o profissional por WhatsApp após a reserva ser paga

### Para profissionais

- Criação de anúncios com fotos, descrição, preço e disponibilidade
- Edição e pausa de anúncios a qualquer momento, sem precisar de nova
  aprovação
- Painel "Meus clientes" com resumo (faturamento confirmado, reservas
  aguardando pagamento, próxima reserva) e lista de todas as reservas,
  ordenada pela mais próxima de acontecer
- Cancelamento de reservas não pagas
- Notificação no app quando uma reserva é paga

### Administração

- Painel `/admin` (só a conta admin acessa): visão geral com faturamento e
  contagens, aprovação/rejeição de anúncios, lista de todas as reservas e
  de todos os usuários, cada um com filtros

## Como funciona o pagamento

Pagamento via Pix, processado pelo [Pagar.me](https://pagar.me). Ao
confirmar uma reserva, o cliente recebe um QR Code Pix pra pagar na hora;
assim que o pagamento é feito, um webhook autenticado avisa o site, que
confirma a reserva automaticamente — sem intervenção manual. Se o
pagamento falha ou expira sem ser feito, o horário é liberado de volta
pra outra pessoa reservar. Cartão de crédito ainda não existe, só Pix.

## Stack técnica

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Prisma](https://www.prisma.io) + PostgreSQL ([Neon](https://neon.tech))
- [NextAuth](https://next-auth.js.org) — login por e-mail/senha e Google
- [Tailwind CSS](https://tailwindcss.com)
- [Pagar.me](https://pagar.me) — pagamento via Pix
- [Resend](https://resend.com) — e-mails transacionais (recuperação de
  senha, verificação de cadastro)
- Deploy automático via [Vercel](https://vercel.com)

## Rodando localmente

```bash
npm install
npx prisma migrate dev
npm run dev
```

Precisa de um arquivo `.env` (com `DATABASE_URL`) e `.env.local` com as
demais variáveis — veja a lista completa abaixo.

### Variáveis de ambiente

| Variável | Pra que serve |
|---|---|
| `DATABASE_URL` | Conexão com o Postgres (Neon) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth (login) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login com Google |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Conta de admin provisória |
| `PAGARME_SECRET_KEY` | Criar cobranças Pix |
| `PAGARME_WEBHOOK_USER` / `PAGARME_WEBHOOK_PASSWORD` | Autenticar o webhook que confirma pagamento |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Enviar e-mails transacionais |

## Como colocar no ar (passo a passo, sem precisar saber programar)

1. Crie uma conta gratuita em [neon.tech](https://neon.tech) — isso te dá
   o banco de dados. Copie a "connection string" (URL que começa com
   `postgresql://`).
2. Crie uma conta em [github.com](https://github.com) e suba esta pasta
   como um repositório novo.
3. Crie uma conta em [vercel.com](https://vercel.com), conecte com o
   GitHub e importe o repositório. Adicione as variáveis de ambiente da
   tabela acima nas configurações do projeto.
4. O Vercel builda e publica automaticamente. Toda vez que o código for
   atualizado no GitHub, o site atualiza sozinho.

## Roadmap

1. **Shopify App Proxy** — conectar `verdog.com.br/agendamento` a este
   projeto, pra quem já visita a loja descobrir o agendamento.
2. **Cartão de crédito** como forma de pagamento adicional (hoje só Pix).
3. Notificações automáticas fora do app (hoje é só o sino interno +
   WhatsApp manual) e avaliações de profissionais.
4. Armazenamento de fotos num serviço de verdade — hoje ficam comprimidas
   dentro do próprio banco, o que funciona mas não escala indefinidamente.
