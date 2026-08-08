// callbackUrl vem de query string (?callbackUrl=...) — não confiar sem
// validar. Só aceita caminho relativo que comece com uma única barra; recusa
// URL absoluta (https://site-malicioso.com) e "//site-malicioso.com" ou
// "/\site-malicioso.com" (formas de URL "protocol-relative" que navegadores
// tratam como link externo apesar de começarem com barra) — sem isso, um
// link como /login?callbackUrl=https://phishing.com redireciona a pessoa
// pra fora do site logo depois dela entrar/criar conta.
export function callbackUrlSeguro(valor: string | null | undefined, padrao = "/") {
  if (!valor) return padrao;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) {
    return padrao;
  }
  return valor;
}
