"use server";

import { revalidatePath } from "next/cache";
import { obterSessao } from "@/lib/sessao";
import { mensagemErro, numero, type Estado } from "@/lib/formulario";
import { PERFIS, TIPOS_VENDEDOR } from "@/lib/dominio";

export async function salvarUsuario(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const id = String(form.get("id"));
  const perfil = String(form.get("perfil"));
  const tipo = String(form.get("tipo_vendedor") ?? "");
  if (!PERFIS.some((p) => p.id === perfil)) return { erro: "Perfil inválido." };
  const { data, error } = await supabase
    .from("usuarios")
    .update({
      perfil,
      tipo_vendedor: TIPOS_VENDEDOR.some((t) => t.id === tipo) ? tipo : null,
      ativo: form.get("ativo") === "on",
    })
    .eq("id", id)
    .select("id");
  if (error) return { erro: mensagemErro(error) };
  if (!data?.length) return { erro: "Seu perfil não tem permissão para alterar usuários." };
  revalidatePath("/configuracoes");
  return { ok: "Usuário atualizado." };
}

/** Salva as porcentagens editadas na tela (campos regra_<id>, cce_<id>, param_<chave>), em %. */
export async function salvarRegras(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await obterSessao();
  const alteracoes: PromiseLike<{ error: { message?: string; code?: string } | null; count: number | null }>[] = [];
  for (const [k, v] of form.entries()) {
    const n = numero(v);
    if (n == null) continue;
    if (n < 0 || n > 100) return { erro: "As porcentagens devem ficar entre 0% e 100%." };
    if (k.startsWith("regra_")) alteracoes.push(supabase.from("regras_comissao").update({ percentual: n / 100 }, { count: "exact" }).eq("id", Number(k.slice(6))));
    else if (k.startsWith("cce_")) alteracoes.push(supabase.from("faixas_cce").update({ percentual: n / 100 }, { count: "exact" }).eq("id", Number(k.slice(4))));
    else if (k.startsWith("param_")) alteracoes.push(supabase.from("parametros_comerciais").update({ valor: n / 100 }, { count: "exact" }).eq("chave", k.slice(6)));
  }
  const resultados = await Promise.all(alteracoes);
  const falha = resultados.find((r) => r.error);
  if (falha) return { erro: mensagemErro(falha.error) };
  if (resultados.length && resultados.every((r) => !r.count)) return { erro: "Seu perfil não tem permissão para alterar as regras de comissão." };
  revalidatePath("/configuracoes");
  return { ok: "Regras de comissão salvas." };
}
