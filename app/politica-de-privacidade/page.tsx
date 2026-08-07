import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="pt-5">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      <div className="text-sm text-neutral-600 leading-relaxed mt-1.5 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

export default function PoliticaDePrivacidade() {
  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="px-4 pt-2 pb-2">
        <h1 className="text-xl font-medium">Política de Privacidade</h1>
        <p className="text-xs text-neutral-400 mt-1">Última atualização: agosto de 2026</p>
      </div>

      <div className="px-4 pb-10">
        <p className="text-sm text-neutral-600 leading-relaxed">
          Esta política explica quais dados o Verdog coleta, por que coleta, com
          quem compartilha e quais direitos você tem sobre eles, em conformidade
          com a Lei Geral de Proteção de Dados (LGPD).
        </p>

        <Secao titulo="Quem somos">
          <p>
            O Verdog é uma plataforma de agendamento que conecta tutores de pets
            a passeadores, adestradores e serviços de hospedagem, operada por
            VERDOG PETSHOP LTDA (CNPJ 46.583.587/0001-00).
          </p>
        </Secao>

        <Secao titulo="Quais dados coletamos">
          <p>
            <strong>De quem cria uma conta:</strong> nome, e-mail, telefone,
            CPF, endereço e, opcionalmente, foto de perfil.
          </p>
          <p>
            <strong>De quem anuncia serviços (profissionais):</strong> nome,
            e-mail, telefone, fotos e descrições dos serviços oferecidos.
          </p>
          <p>
            <strong>Ao fazer uma reserva:</strong> os dados acima mais o
            registro da própria reserva (datas, valor, status do pagamento).
          </p>
          <p>
            Não armazenamos dados de cartão de crédito ou qualquer informação
            bancária — os pagamentos são processados diretamente pelo Pagar.me.
          </p>
        </Secao>

        <Secao titulo="Por que coletamos esses dados">
          <p>
            Para viabilizar o agendamento entre clientes e profissionais, gerar
            a cobrança Pix (o CPF é exigido pelo Banco Central para esse tipo de
            pagamento), permitir contato entre as partes via WhatsApp e cumprir
            obrigações legais e fiscais.
          </p>
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          <p>
            <strong>Pagar.me:</strong> processa os pagamentos Pix — recebe nome,
            e-mail, CPF e telefone necessários pra gerar a cobrança.
          </p>
          <p>
            <strong>Profissional ou cliente da reserva:</strong> ao confirmar
            uma reserva, nome e contato são compartilhados entre cliente e
            profissional pra viabilizar o serviço.
          </p>
          <p>Não vendemos dados pessoais a terceiros.</p>
        </Secao>

        <Secao titulo="Como protegemos seus dados">
          <p>
            Senhas são armazenadas com hash (nunca em texto puro), a conexão com
            o site é criptografada (HTTPS) e o acesso ao banco de dados é
            restrito à equipe técnica responsável pela operação da plataforma.
          </p>
        </Secao>

        <Secao titulo="Seus direitos (LGPD)">
          <p>
            Você pode solicitar a qualquer momento: acesso aos seus dados,
            correção de informações incorretas, exclusão da sua conta,
            portabilidade dos dados ou revogação do consentimento. Para
            exercer qualquer desses direitos, fale com a gente pelos contatos
            no rodapé do site.
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos seus dados">
          <p>
            Enquanto sua conta estiver ativa, e depois disso pelo prazo exigido
            por obrigações legais e fiscais (ex: registros de pagamento).
          </p>
        </Secao>

        <Secao titulo="Cookies">
          <p>
            Usamos apenas um cookie essencial de sessão pra manter você logado
            — não usamos cookies de rastreamento ou publicidade de terceiros.
          </p>
        </Secao>

        <Secao titulo="Dúvidas">
          <p>Fale com a gente pelo WhatsApp ou Instagram, no rodapé do site.</p>
        </Secao>
      </div>
    </main>
  );
}
