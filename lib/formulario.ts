export type Estado = { erro?: string; ok?: string } | undefined;

export function mensagemErro(e: { message?: string; code?: string } | null) {
  if (!e) return undefined;
  if (e.code === "42501" && e.message?.includes("row-level security")) {
    return "Seu perfil não tem permissão para esta alteração.";
  }
  return e.message ?? "Não foi possível salvar. Tente de novo.";
}

export const numero = (v: FormDataEntryValue | null) => {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim();
  // Campos numéricos do navegador usam ponto decimal; texto digitado à mão pode vir como "1.234,56".
  let n = Number(s);
  if (!Number.isFinite(n)) n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
export const texto = (v: FormDataEntryValue | null) => (v == null || String(v).trim() === "" ? null : String(v).trim());
