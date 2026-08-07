const PAGARME_API_URL = "https://api.pagar.me/core/v5";

function cabecalhoAuth() {
  const chaveSecreta = process.env.PAGARME_SECRET_KEY;
  if (!chaveSecreta) {
    throw new Error("PAGARME_SECRET_KEY não configurada.");
  }
  return "Basic " + Buffer.from(`${chaveSecreta}:`).toString("base64");
}

export type CobrancaPix = {
  orderId: string;
  chargeId: string;
  qrCode: string;
  qrCodeUrl: string;
  expiraEm: Date;
};

const PIX_EXPIRA_EM_SEGUNDOS = 30 * 60;

// Cria um pedido no Pagar.me com pagamento via Pix e devolve o QR Code.
// Documentação: https://docs.pagar.me/reference/criar-pedido-2
export async function criarCobrancaPix(params: {
  agendamentoId: string;
  valorCentavos: number;
  descricao: string;
  clienteNome: string;
  clienteCpf: string;
  clienteTelefone: string;
  clienteEmail: string;
}): Promise<CobrancaPix> {
  const cpf = params.clienteCpf.replace(/\D/g, "");
  const telefone = params.clienteTelefone.replace(/\D/g, "");
  const ddd = telefone.slice(0, 2) || "11";
  const numero = telefone.slice(2) || telefone;

  const res = await fetch(`${PAGARME_API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: cabecalhoAuth(),
    },
    body: JSON.stringify({
      items: [
        {
          code: params.agendamentoId,
          amount: params.valorCentavos,
          description: params.descricao,
          quantity: 1,
        },
      ],
      customer: {
        name: params.clienteNome,
        email: params.clienteEmail,
        document: cpf,
        document_type: "CPF",
        type: "individual",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: ddd,
            number: numero,
          },
        },
      },
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: PIX_EXPIRA_EM_SEGUNDOS,
          },
        },
      ],
      metadata: {
        agendamentoId: params.agendamentoId,
      },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    const detalhe = json?.message || JSON.stringify(json?.errors ?? json);
    throw new Error(`Falha ao criar cobrança Pix no Pagar.me: ${detalhe}`);
  }

  const cobranca = json.charges?.[0];
  const transacao = cobranca?.last_transaction;

  if (!cobranca?.id || !transacao?.qr_code) {
    throw new Error("Pagar.me não retornou o QR Code do Pix.");
  }

  return {
    orderId: json.id,
    chargeId: cobranca.id,
    qrCode: transacao.qr_code as string,
    qrCodeUrl: transacao.qr_code_url as string,
    expiraEm: new Date(Date.now() + PIX_EXPIRA_EM_SEGUNDOS * 1000),
  };
}
