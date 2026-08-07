"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import GoogleIcon from "@/components/GoogleIcon";
import BotaoVoltar from "@/components/BotaoVoltar";

const ERRO_LABEL: Record<string, string> = {
  OAuthSignin: "Não foi possível iniciar o login com Google.",
  OAuthCallback: "O Google recusou o login (erro na volta). Verifique as credenciais/URIs configuradas.",
  OAuthCreateAccount: "Não foi possível criar sua conta a partir do Google.",
  OAuthAccountNotLinked: "Esse e-mail já tem uma conta criada de outra forma. Entre com e-mail e senha.",
  AccessDenied: "Acesso negado pelo Google — sua conta pode não estar liberada como testadora do app ainda.",
  Configuration: "Erro de configuração do login. Avise o suporte.",
  Default: "Não foi possível entrar com o Google. Tente novamente.",
};

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const erroOAuth = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(
    erroOAuth ? ERRO_LABEL[erroOAuth] ?? ERRO_LABEL.Default : ""
  );
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const res = await signIn("credentials", { email, senha, redirect: false });

    setCarregando(false);

    if (!res || res.error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <BotaoVoltar />

      <div className="flex flex-col items-center pt-8 pb-2">
        <Image src="/logo.png" alt="Verdog" width={1068} height={481} className="h-10 w-auto" priority />
        <div className="text-xs text-neutral-500 mt-2">
          Entre para agendar ou anunciar seus serviços
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pt-6">
        <label className="text-xs text-neutral-600">
          E-mail
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seunome@email.com"
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs text-neutral-600">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>

        <Link href="/esqueci-senha" className="text-xs text-verdog self-end -mt-1">
          Esqueci minha senha
        </Link>

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="bg-verdog text-white text-sm font-medium rounded-lg py-3 mt-1 disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <Link
          href={`/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-center border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg py-3"
        >
          Registrar
        </Link>
      </form>

      <div className="flex items-center gap-3 px-4 py-6">
        <div className="h-px flex-1 bg-neutral-100" />
        <span className="text-xs text-neutral-400">ou</span>
        <div className="h-px flex-1 bg-neutral-100" />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-8">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex items-center justify-center gap-2.5 border border-neutral-200 rounded-lg py-3 text-sm font-medium"
        >
          <GoogleIcon className="w-5 h-5" />
          Login com Google
        </button>
      </div>
    </main>
  );
}
