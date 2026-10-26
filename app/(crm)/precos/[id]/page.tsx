import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotaoEnviar, Formulario } from "@/components/Formulario";
import { Cartao, Campo, classeCampo } from "@/components/ui";
import { obterSessao, pode } from "@/lib/sessao";
import { criarProduto, desativarProduto, salvarProduto } from "../acoes";

export const metadata: Metadata = { title: "Produto" };

type P = Record<string, string | number | boolean | null>;

export default async function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, usuario } = await obterSessao();
  if (!pode.editarPrecos(usuario?.perfil)) redirect("/precos");
  const novo = id === "novo";

  let p: P = { tipo_tabela: "rad", st: false };
  if (!novo) {
    const [{ data }, { data: custos }] = await Promise.all([
      supabase.from("produtos").select("id, codigo_totvs, nome, grupo, ncm, densidade, consumo, embalagem, unidade, preco, ipi, st, quantidade_embalagem, preco_icms_7, preco_icms_12, preco_icms_18, tipo_tabela").eq("id", Number(id)).maybeSingle<P>(),
      supabase.rpc("produtos_custos"),
    ]);
    if (!data) notFound();
    const c = ((custos ?? []) as { id: number; custo: number | null; mi_objetivo: number | null }[]).find((x) => x.id === Number(id));
    p = { ...data, custo: c?.custo ?? null, mi_objetivo: c?.mi_objetivo ?? null };
  }

  const campo = (name: string, rotulo: string, tipo: "text" | "number" = "text", extra: Record<string, string> = {}) => (
    <Campo rotulo={rotulo}>
      <input name={name} type={tipo} step={tipo === "number" ? "any" : undefined} defaultValue={(p[name] as string | number | null) ?? ""} className={`${classeCampo} ${tipo === "number" ? "num" : ""}`} {...extra} />
    </Campo>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/precos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-azul hover:underline">
        <ArrowLeft className="size-4" /> Voltar à tabela de preços
      </Link>
      <Cartao titulo={novo ? "Novo produto" : String(p.nome)}>
        <Formulario acao={novo ? criarProduto : salvarProduto} className="p-5">
          {!novo && <input type="hidden" name="id" value={String(p.id)} />}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("nome", "Nome do produto", "text", { required: "" })}
            {campo("codigo_totvs", "Código TOTVS")}
            {campo("grupo", "Grupo")}
            <Campo rotulo="Tabela">
              <select name="tipo_tabela" defaultValue={String(p.tipo_tabela)} className={classeCampo}>
                <option value="rad">RAD</option>
                <option value="aditivo">Aditivos</option>
              </select>
            </Campo>
            {campo("embalagem", "Embalagem")}
            {campo("quantidade_embalagem", "Quantidade da embalagem (kg ou L)", "number")}
            {campo("preco", "Preço de venda do kit (R$)", "number")}
            {campo("ipi", "IPI (%)", "number")}
            {campo("preco_icms_7", "Preço por kg com ICMS 7%", "number")}
            {campo("preco_icms_12", "Preço por kg com ICMS 12%", "number")}
            {campo("preco_icms_18", "Preço por kg com ICMS 18%", "number")}
            {campo("custo", "Custo por kg (R$)", "number")}
            {campo("mi_objetivo", "% MI objetivo", "number")}
            {campo("ncm", "NCM")}
            {campo("unidade", "Unidade de venda")}
            {campo("densidade", "Densidade (g/cm³)")}
            {campo("consumo", "Consumo aproximado")}
            <label className="flex items-center gap-2.5 self-end pb-2 text-[15px] text-tinta">
              <input type="checkbox" name="st" defaultChecked={!!p.st} className="size-4 accent-[#2d6bc4]" />
              Sujeito a ST
            </label>
          </div>
          <div className="mt-6 flex justify-end">
            <BotaoEnviar>{novo ? "Cadastrar produto" : "Salvar produto"}</BotaoEnviar>
          </div>
        </Formulario>
        {!novo && (
          <Formulario acao={desativarProduto} className="border-t border-linha px-5 py-4">
            <input type="hidden" name="id" value={String(p.id)} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-apagado">Retirar da tabela esconde o produto da consulta, sem apagar o histórico.</p>
              <BotaoEnviar variante="perigo">Retirar da tabela</BotaoEnviar>
            </div>
          </Formulario>
        )}
      </Cartao>
    </div>
  );
}
