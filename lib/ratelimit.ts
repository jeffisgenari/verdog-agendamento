import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sem UPSTASH_REDIS_REST_URL/TOKEN configurados (ex: rodando local sem
// essas variáveis), a limitação vira um no-op — não trava nada, só não
// protege. Em produção, com as variáveis definidas, passa a valer de
// verdade. Isso evita que o app pare de funcionar caso o Redis fique fora
// do ar — prioriza o site continuar no ar a ter essa camada extra de
// proteção (falha aberta, não fechada).
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function criarLimitador(tentativas: number, janela: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tentativas, janela),
    prefix: "verdog",
  });
}

// Login (por e-mail tentado, não por IP — barra quem tenta adivinhar a
// senha de uma conta específica, mesmo trocando de IP).
const limiteLogin = criarLimitador(5, "5 m");
// Criar conta (por IP).
const limiteRegistro = criarLimitador(5, "1 h");
// Pedido de redefinição de senha (por e-mail alvo — evita spam de e-mail
// pra caixa de entrada de outra pessoa).
const limiteEsqueciSenha = criarLimitador(3, "1 h");
// Reenvio de e-mail de verificação (por conta já logada).
const limiteReenviarVerificacao = criarLimitador(3, "1 h");
// Criação de reserva/cobrança Pix (por conta já logada).
const limiteReserva = criarLimitador(15, "1 h");

async function bloqueado(limitador: Ratelimit | null, chave: string) {
  if (!limitador) return false;
  const { success } = await limitador.limit(chave);
  return !success;
}

export const RateLimit = {
  login: (email: string) => bloqueado(limiteLogin, `login:${email}`),
  registro: (ip: string) => bloqueado(limiteRegistro, `registro:${ip}`),
  esqueciSenha: (email: string) => bloqueado(limiteEsqueciSenha, `esqueci:${email}`),
  reenviarVerificacao: (userId: string) => bloqueado(limiteReenviarVerificacao, `reenviar:${userId}`),
  reserva: (userId: string) => bloqueado(limiteReserva, `reserva:${userId}`),
};

export function ipDaRequisicao(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}
