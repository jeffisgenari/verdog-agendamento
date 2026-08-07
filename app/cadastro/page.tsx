"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";
import BotaoVoltar from "@/components/BotaoVoltar";
import { formatarCpf, cpfValido } from "@/lib/cpf";

export default function Cadastro() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  );
}

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: "",
    endereco: "",
    numero: "",
    complemento: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function set(campo: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!cpfValido(form.cpf)) {
      setErro("Informe um CPF válido.");
      return;
    }

    setCarregando(true);

    const res = await fetch("/api/usuario/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setCarregando(false);
      setErro(data.error ?? "Não foi possível criar a conta.");
      return;
    }

    const login = await signIn("credentials", {
      email: form.email,
      senha: form.senha,
      redirect: false,
    });

    setCarregando(false);

    if (!login || login.error) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // Toda conta nova cai em "completar cadastro" — o callbackUrl segue
    // junto pra voltar exatamente onde a pessoa estava (ex: reservando um
    // anúncio) depois de escolher cliente/profissional.
    router.push(`/completar-cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    router.refresh();
  }

  const campo = (
    label: string,
    campo: keyof typeof form,
    opts: { type?: string; obrigatorio?: boolean; autoComplete?: string } = {}
  ) => (
    <label className="text-xs text-neutral-600">
      {label}
      {opts.obrigatorio === false && (
        <span className="text-neutral-400"> (opcional)</span>
      )}
      <input
        type={opts.type ?? "text"}
        name={campo}
        autoComplete={opts.autoComplete}
        value={form[campo]}
        onChange={set(campo)}
        className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <BotaoVoltar />

      <div className="flex flex-col items-center pt-8 pb-2">
        <Image src="/logo.png" alt="Verdog" width={1068} height={481} className="h-10 w-auto" />
        <div className="text-xs text-neutral-500 mt-2">Criar conta</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pt-6 pb-8">
        {campo("Nome completo", "nome", { autoComplete: "name" })}
        {campo("E-mail", "email", { type: "email", autoComplete: "email" })}
        {campo("Telefone", "telefone", { type: "tel", autoComplete: "tel" })}
        <label className="text-xs text-neutral-600">
          CPF
          <input
            type="text"
            name="cpf"
            value={form.cpf}
            onChange={(e) => setForm((f) => ({ ...f, cpf: formatarCpf(e.target.value) }))}
            inputMode="numeric"
            maxLength={14}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        {campo("Senha", "senha", { type: "password", autoComplete: "new-password" })}
        {campo("Endereço", "endereco", { autoComplete: "address-line1" })}
        {campo("Número", "numero", { autoComplete: "address-line2" })}
        {campo("Complemento", "complemento", { obrigatorio: false, autoComplete: "address-line3" })}

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="bg-verdog text-white text-sm font-medium rounded-lg py-3 mt-3 disabled:opacity-60"
        >
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </main>
  );
}
