import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BuscaCliente } from "@/components/BuscaCliente";
import { CamposProposta } from "@/components/CamposProposta";
import { BotaoEnviar, Formulario } from "@/components/Formulario";
import { Cartao, Campo } from "@/components/ui";
import { obterSessao, pode } from "@/lib/sessao";
import { criarProposta } from "../acoes";

export const metadata: Metadata = { title: "Nova proposta" };

export default async function NovaProposta({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente } = await searchParams;
  const { supabase, usuario } = await obterSessao();
  if (!pode.criarProposta(usuario?.perfil)) redirect("/pipeline");

  const { data: inicial } = cliente
    ? await supabase.from("clientes").select("id, razao_social, cnpj, cpf, cidade, uf").eq("id", Number(cliente)).maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/pipeline" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-azul hover:underline">
        <ArrowLeft className="size-4" /> Voltar ao pipeline
      </Link>
      <Cartao titulo="Nova proposta">
        <Formulario acao={criarProposta} className="p-5">
          <Campo rotulo="Cliente" className="mb-4">
            <BuscaCliente name="cliente_id" inicial={inicial} />
          </Campo>
          <p className="mb-5 rounded-lg bg-nevoa px-3.5 py-2.5 text-[13px] leading-relaxed text-apagado">
            A proposta fica com o vendedor responsável pelo cliente e começa no estágio Criação proposta. O código é gerado
            automaticamente.
          </p>
          <CamposProposta />
          <div className="mt-6 flex justify-end gap-2">
            <Link href="/pipeline" className="inline-flex h-10 items-center px-4 text-sm font-medium text-apagado hover:text-marinho">Cancelar</Link>
            <BotaoEnviar>Criar proposta</BotaoEnviar>
          </div>
        </Formulario>
      </Cartao>
    </div>
  );
}
