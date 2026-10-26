"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { mensagemErro, texto, type Estado } from "@/lib/formulario";

const CAMPOS_GERAIS = [
  "tipo_pessoa", "razao_social", "nome_fantasia", "cnpj", "cpf", "contato", "segmento_original", "cidade", "uf",
  "status", "origem", "telefone", "email",
] as const;
const CAMPOS_FATURAMENTO = ["inscricao_estadual", "email_faturamento", "endereco_faturamento", "cond_pagamento_padrao", "obs_faturamento"] as const;

function ler(form: FormData, perfil: string | undefined, meuId: string | undefined) {
  const dados: Record<string, string | number | null> = {};
  const campos = perfil === "financeiro" ? CAMPOS_FATURAMENTO : [...CAMPOS_GERAIS, ...CAMPOS_FATURAMENTO];
  for (const c of campos) dados[c] = texto(form.get(c));
  if (perfil !== "financeiro") {
    dados.uf = dados.uf ? String(dados.uf).toUpperCase().slice(0, 2) : null;
    dados.tipo_pessoa = dados.tipo_pessoa === "fisica" ? "fisica" : "juridica";
    dados.representante_id = perfil === "operacional" ? (meuId ?? null) : texto(form.get("representante_id"));
    const seg = texto(form.get("segmento_id"));
    dados.segmento_id = seg ? Number(seg) : null;
  }
  return dados;
}

export async function salvarCliente(_: Estado, form: FormData): Promise<Estado> {
  const { supabase, usuario } = await obterSessao();
  const id = Number(form.get("id"));
  const dados = ler(form, usuario?.perfil, usuario?.id);
  if (usuario?.perfil !== "financeiro" && !dados.razao_social) return { erro: "Informe a razão social ou o nome do cliente." };

  const { data, error } = await supabase.from("clientes").update(dados).eq("id", id).select("id");
  if (error) return { erro: mensagemErro(error) };
  if (!data?.length) return { erro: "Seu perfil não tem permissão para editar este cliente." };
  revalidatePath(`/contatos/${id}`);
  revalidatePath("/contatos");
  return { ok: "Cadastro atualizado." };
}

export async function criarCliente(_: Estado, form: FormData): Promise<Estado> {
  const { supabase, usuario } = await obterSessao();
  const dados = ler(form, usuario?.perfil, usuario?.id);
  if (!dados.razao_social) return { erro: "Informe a razão social ou o nome do cliente." };
  if (!dados.representante_id) return { erro: "Escolha o vendedor responsável pelo cliente." };

  const { data, error } = await supabase.from("clientes").insert(dados).select("id").single();
  if (error) return { erro: mensagemErro(error) };
  revalidatePath("/contatos");
  redirect(`/contatos/${data.id}`);
}
