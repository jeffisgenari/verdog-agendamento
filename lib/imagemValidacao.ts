// Validação server-side de imagens em base64 (fotos de anúncio, avatar).
// O navegador já comprime pra JPEG bem menor que isso antes de enviar (ver
// lib/imagem.ts), mas quem chamar a API direto (sem passar pela tela) não
// passa por essa compressão — sem checar aqui, dava pra mandar um arquivo
// enorme ou um tipo fora do esperado (ex: SVG, que pode conter script).
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024; // 3MB — bem acima do que a compressão gera, só de margem

export function imagemValida(valor: unknown): valor is string {
  if (typeof valor !== "string") return false;

  const match = valor.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return false;

  const [, tipo, base64] = match;
  if (!TIPOS_PERMITIDOS.includes(tipo)) return false;

  const bytesAprox = (base64.length * 3) / 4;
  return bytesAprox <= MAX_BYTES;
}
