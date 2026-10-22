"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FormLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) {
      setErro(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos. Confira e tente de novo."
          : "Não foi possível entrar agora. Tente de novo em instantes.",
      );
      return;
    }
    const voltar = params.get("voltar");
    router.replace(voltar && voltar.startsWith("/") ? voltar : "/dashboard");
    router.refresh();
  }

  async function esqueciSenha() {
    setErro(null);
    setAviso(null);
    if (!email) {
      setErro("Digite seu e-mail acima para receber o link de nova senha.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setAviso("Se esse e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.");
  }

  return (
    <form onSubmit={entrar} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-tinta">E-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border border-linha bg-white px-3.5 text-[15px] outline-none transition-colors placeholder:text-apagado/60 focus:border-azul focus:ring-3 focus:ring-azul/15"
          placeholder="nome@eltechquimica.com.br"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-tinta">
          Senha
          <button type="button" onClick={esqueciSenha} className="text-[13px] font-medium text-azul hover:underline">
            Esqueci a senha
          </button>
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="h-11 w-full rounded-lg border border-linha bg-white px-3.5 text-[15px] outline-none transition-colors focus:border-azul focus:ring-3 focus:ring-azul/15"
        />
      </label>

      {erro && (
        <p role="alert" className="rounded-lg bg-[#fbeeee] px-3.5 py-2.5 text-sm text-[#9a3a40]">
          {erro}
        </p>
      )}
      {aviso && <p className="rounded-lg bg-ceu px-3.5 py-2.5 text-sm text-marinho">{aviso}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-azul text-[15px] font-semibold text-white transition-colors hover:bg-azul-escuro disabled:opacity-70"
      >
        {enviando && <Loader2 className="size-4 animate-spin" />}
        Entrar
      </button>
    </form>
  );
}
