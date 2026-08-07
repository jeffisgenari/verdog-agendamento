// Monta um link wa.me a partir de um telefone digitado livremente (com ou
// sem DDI, parênteses, traço, espaço). Assume Brasil (55) quando não vem
// código de país.
export function linkWhatsapp(telefone: string, mensagem?: string) {
  const digitos = telefone.replace(/\D/g, "");
  const comDdi = digitos.length <= 11 ? `55${digitos}` : digitos;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${comDdi}${texto}`;
}
