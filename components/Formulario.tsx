"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Mensagem, classeBotao } from "@/components/ui";
import type { Estado } from "@/lib/formulario";

type Acao = (estado: Estado, form: FormData) => Promise<Estado>;

/** Formulário ligado a uma ação do servidor, com mensagem de sucesso ou erro. */
export function Formulario({
  acao,
  children,
  className = "",
}: {
  acao: Acao;
  children: React.ReactNode;
  className?: string;
}) {
  const [estado, executar] = useActionState(acao, undefined);
  return (
    <form action={executar} className={className}>
      {children}
      {estado?.erro && <div className="mt-3"><Mensagem tipo="erro">{estado.erro}</Mensagem></div>}
      {estado?.ok && <div className="mt-3"><Mensagem tipo="ok">{estado.ok}</Mensagem></div>}
    </form>
  );
}

export function BotaoEnviar({
  children,
  variante = "primario",
  name,
  value,
  className = "",
}: {
  children: React.ReactNode;
  variante?: keyof typeof classeBotao;
  name?: string;
  value?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`${classeBotao[variante]} ${className}`}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
