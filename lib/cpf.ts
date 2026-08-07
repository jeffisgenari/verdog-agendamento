export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor: string) {
  const d = apenasDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function cpfValido(valor: string) {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (const totalDigitos of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < totalDigitos; i++) {
      soma += parseInt(cpf[i], 10) * (totalDigitos + 1 - i);
    }
    const resto = (soma * 10) % 11;
    const digitoEsperado = resto === 10 ? 0 : resto;
    if (digitoEsperado !== parseInt(cpf[totalDigitos], 10)) return false;
  }

  return true;
}
