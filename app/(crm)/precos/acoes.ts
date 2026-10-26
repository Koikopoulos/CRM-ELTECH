"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { mensagemErro, numero, texto, type Estado } from "@/lib/formulario";

function ler(form: FormData) {
  const tabela = texto(form.get("tipo_tabela"));
  return {
    nome: texto(form.get("nome")), codigo_totvs: texto(form.get("codigo_totvs")), grupo: texto(form.get("grupo")),
    ncm: texto(form.get("ncm")), embalagem: texto(form.get("embalagem")), unidade: texto(form.get("unidade")),
    consumo: texto(form.get("consumo")), densidade: texto(form.get("densidade")),
    preco: numero(form.get("preco")), ipi: numero(form.get("ipi")), quantidade_embalagem: numero(form.get("quantidade_embalagem")),
    preco_icms_7: numero(form.get("preco_icms_7")), preco_icms_12: numero(form.get("preco_icms_12")), preco_icms_18: numero(form.get("preco_icms_18")),
    custo: numero(form.get("custo")), mi_objetivo: numero(form.get("mi_objetivo")),
    st: form.get("st") === "on",
    tipo_tabela: tabela === "aditivo" ? "aditivo" : "rad",
  };
}

export async function salvarProduto(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const id = Number(form.get("id"));
  const dados = ler(form);
  if (!dados.nome) return { erro: "Informe o nome do produto." };
  const { error, count } = await supabase.from("produtos").update(dados, { count: "exact" }).eq("id", id);
  if (error) return { erro: mensagemErro(error) };
  if (!count) return { erro: "Seu perfil não tem permissão para alterar preços." };
  revalidatePath("/precos");
  revalidatePath(`/precos/${id}`);
  return { ok: "Produto atualizado." };
}

export async function criarProduto(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const dados = ler(form);
  if (!dados.nome) return { erro: "Informe o nome do produto." };
  const { error } = await supabase.from("produtos").insert(dados);
  if (error) return { erro: mensagemErro(error) };
  revalidatePath("/precos");
  redirect("/precos");
}

export async function desativarProduto(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const id = Number(form.get("id"));
  const { error, count } = await supabase.from("produtos").update({ ativo: false }, { count: "exact" }).eq("id", id);
  if (error) return { erro: mensagemErro(error) };
  if (!count) return { erro: "Seu perfil não tem permissão para alterar preços." };
  revalidatePath("/precos");
  redirect("/precos");
}
