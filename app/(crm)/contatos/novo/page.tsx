import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CamposCliente } from "@/components/CamposCliente";
import { BotaoEnviar, Formulario } from "@/components/Formulario";
import { Cartao } from "@/components/ui";
import { obterSessao, pode } from "@/lib/sessao";
import { criarCliente } from "../acoes";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NovoCliente() {
  const { supabase, usuario } = await obterSessao();
  if (!pode.criarCliente(usuario?.perfil)) redirect("/contatos");
  const [{ data: vendedores }, { data: segmentos }] = await Promise.all([
    supabase.from("usuarios").select("id, nome").eq("ativo", true).in("tipo_vendedor", ["representante", "vendedor_interno"]).order("nome"),
    supabase.from("segmentos").select("id, nome").order("nome"),
  ]);
  const escolher = usuario?.perfil === "diretoria" || usuario?.perfil === "admin";

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/contatos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-azul hover:underline">
        <ArrowLeft className="size-4" /> Voltar aos contatos
      </Link>
      <Cartao titulo="Novo cliente">
        <Formulario acao={criarCliente} className="p-5">
          <CamposCliente
            c={{ representante_id: escolher ? undefined : usuario?.id }}
            vendedores={escolher ? (vendedores ?? []) : [{ id: usuario!.id, nome: usuario!.nome }]}
            escolherVendedor={escolher}
            segmentos={segmentos ?? []}
          />
          <div className="mt-6 flex justify-end gap-2">
            <Link href="/contatos" className="inline-flex h-10 items-center px-4 text-sm font-medium text-apagado hover:text-marinho">Cancelar</Link>
            <BotaoEnviar>Cadastrar cliente</BotaoEnviar>
          </div>
        </Formulario>
      </Cartao>
    </div>
  );
}
