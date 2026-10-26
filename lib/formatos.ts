const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCurto = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("pt-BR");

export const moeda = (v: number | string | null | undefined) => (v == null ? "—" : brl.format(Number(v)));
export const moedaCurta = (v: number | string | null | undefined) => (v == null ? "—" : brlCurto.format(Number(v)));
export const inteiro = (v: number | null | undefined) => (v == null ? "—" : num.format(v));
export const percentual = (v: number | string | null | undefined, casas = 1) =>
  v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas })}%`;

export function data(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
}
export function dataHora(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}
export function diasDesde(v: string | null | undefined) {
  if (!v) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 86_400_000));
}
