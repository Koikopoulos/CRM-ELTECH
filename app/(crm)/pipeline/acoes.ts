"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { ESTAGIOS } from "@/lib/dominio";
import { mensagemErro, numero, texto, type Estado } from "@/lib/formulario";


export async function moverEstagio(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const id = Number(form.get("id"));
  const estagio = String(form.get("estagio"));
  if (!ESTAGIOS.some((e) => e.id === estagio)) return { erro: "Escolha um estágio válido." };

  const { data, error } = await supabase.from("propostas").update({ estagio }).eq("id", id).select("id");
  if (error) return { erro: mensagemErro(error) };
  if (!data?.length) return { erro: "Seu perfil não tem permissão para mover esta proposta." };
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${id}`);
  revalidatePath("/dashboard");
  return { ok: `Proposta movida para ${ESTAGIOS.find((e) => e.id === estagio)?.nome}.` };
}

export async function registrarParecer(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const id = Number(form.get("id"));
  const parecer = String(form.get("parecer"));
  if (parecer !== "recomendado" && parecer !== "nao_recomendado") return { erro: "Escolha um parecer." };
  const { data, error } = await supabase
    .from("propostas")
    .update({ parecer_financeiro: parecer, parecer_financeiro_obs: texto(form.get("obs")) })
    .eq("id", id)
    .select("id");
  if (error) return { erro: mensagemErro(error) };
  if (!data?.length) return { erro: "Seu perfil não tem permissão para registrar o parecer." };
  revalidatePath(`/pipeline/${id}`);
  return { ok: "Parecer registrado." };
}

function camposProposta(form: FormData) {
  const tabela = texto(form.get("tipo_tabela"));
  const dmp = numero(form.get("dmp"));
  return {
    valor: numero(form.get("valor")) ?? 0,
    possibilidade: numero(form.get("possibilidade")),
    data_fechamento: texto(form.get("data_fechamento")),
    cond_pagamento: texto(form.get("cond_pagamento")),
    observacao: texto(form.get("observacao")),
    tipo_tabela: tabela === "rad" || tabela === "aditivo" ? tabela : null,
    dmp: dmp == null ? null : dmp / 100,
    com_cce: form.get("com_cce") === "on",
  };
}

function validar(c: ReturnType<typeof camposProposta>) {
  if (c.valor < 0) return "O valor não pode ser negativo.";
  if (c.possibilidade != null && (c.possibilidade < 0 || c.possibilidade > 100)) return "A possibilidade deve ficar entre 0% e 100%.";
  if (c.dmp != null && (c.dmp < 0 || c.dmp > 1)) return "O DMP deve ficar entre 0% e 100%.";
  return null;
}

export async function salvarProposta(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const id = Number(form.get("id"));
  const campos = camposProposta(form);
  const invalido = validar(campos);
  if (invalido) return { erro: invalido };

  const { data, error } = await supabase.from("propostas").update(campos).eq("id", id).select("id");
  if (error) return { erro: mensagemErro(error) };
  if (!data?.length) return { erro: "Seu perfil não tem permissão para editar esta proposta." };
  revalidatePath(`/pipeline/${id}`);
  revalidatePath("/pipeline");
  return { ok: "Alterações salvas." };
}

export async function criarProposta(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const clienteId = Number(form.get("cliente_id"));
  if (!clienteId) return { erro: "Escolha o cliente da proposta." };

  const { data: cliente } = await supabase.from("clientes").select("id, razao_social, representante_id").eq("id", clienteId).maybeSingle();
  if (!cliente) return { erro: "Cliente não encontrado ou fora da sua carteira." };
  if (!cliente.representante_id) return { erro: "Este cliente não tem vendedor responsável. Defina o vendedor no cadastro do cliente." };

  const campos = camposProposta(form);
  const invalido = validar(campos);
  if (invalido) return { erro: invalido };

  const { data, error } = await supabase
    .from("propostas")
    .insert({ ...campos, cliente_id: cliente.id, razao_social_original: cliente.razao_social, representante_id: cliente.representante_id })
    .select("id")
    .single();
  if (error) return { erro: mensagemErro(error) };
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  redirect(`/pipeline/${data.id}`);
}
