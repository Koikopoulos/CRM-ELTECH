import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PerfilId } from "@/lib/dominio";

export type UsuarioAtual = {
  id: string;
  nome: string;
  email: string | null;
  perfil: PerfilId;
  tipo_vendedor: "representante" | "vendedor_interno" | "retaguarda" | null;
};

/** Sessão do usuário logado (uma consulta por requisição). */
export const obterSessao = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, tipo_vendedor")
    .eq("auth_id", user.id)
    .maybeSingle();

  return { supabase, user, usuario: (data as UsuarioAtual | null) ?? null };
});

export const pode = {
  editarPrecos: (p?: PerfilId) => p === "diretoria" || p === "admin",
  verCustos: (p?: PerfilId) => p === "diretoria" || p === "admin",
  editarRegras: (p?: PerfilId) => p === "diretoria" || p === "admin",
  excluirRegras: (p?: PerfilId) => p === "diretoria",
  gerirUsuarios: (p?: PerfilId) => p === "diretoria" || p === "admin",
  criarCliente: (p?: PerfilId) => p === "diretoria" || p === "admin" || p === "operacional",
  editarCliente: (p?: PerfilId) => p === "diretoria" || p === "admin" || p === "operacional" || p === "financeiro",
  excluir: (p?: PerfilId) => p === "diretoria" || p === "admin",
  criarProposta: (p?: PerfilId) =>
    p === "diretoria" || p === "admin" || p === "coordenacao" || p === "conferente" || p === "operacional",
  parecerFinanceiro: (p?: PerfilId) => p === "financeiro" || p === "admin" || p === "diretoria",
  validar: (p?: PerfilId) => p === "conferente" || p === "coordenacao" || p === "admin" || p === "diretoria",
};
