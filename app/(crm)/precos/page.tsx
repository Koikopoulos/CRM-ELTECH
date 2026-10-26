import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Tags } from "lucide-react";
import { CabecalhoTabela } from "@/components/Tabela";
import { Paginacao, classeBotao, classeCampo } from "@/components/ui";
import { Vazio } from "@/components/Vazio";
import { moeda, percentual } from "@/lib/formatos";
import { obterSessao, pode } from "@/lib/sessao";

export const metadata: Metadata = { title: "Tabela de preços" };

const POR_PAGINA = 40;
type Produto = {
  id: number; codigo_totvs: string | null; nome: string; grupo: string | null; embalagem: string | null; preco: number | null;
  ipi: number | null; preco_icms_7: number | null; preco_icms_12: number | null; preco_icms_18: number | null; tipo_tabela: string;
};

export default async function Precos({ searchParams }: { searchParams: Promise<{ q?: string; tabela?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const termo = (sp.q ?? "").replace(/[,()*%\\]/g, " ").trim().slice(0, 80);
  const tabela = sp.tabela === "rad" || sp.tabela === "aditivo" ? sp.tabela : "";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const { supabase, usuario } = await obterSessao();
  const verCustos = pode.verCustos(usuario?.perfil);
  const editar = pode.editarPrecos(usuario?.perfil);

  let q = supabase
    .from("produtos")
    .select("id, codigo_totvs, nome, grupo, embalagem, preco, ipi, preco_icms_7, preco_icms_12, preco_icms_18, tipo_tabela", { count: "exact" })
    .eq("ativo", true)
    .order("grupo", { nullsFirst: false })
    .order("nome")
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  if (termo) q = q.or(`nome.ilike.%${termo}%,codigo_totvs.ilike.%${termo}%,grupo.ilike.%${termo}%`);
  if (tabela) q = q.eq("tipo_tabela", tabela);

  const [{ data, count }, custos] = await Promise.all([
    q,
    verCustos ? supabase.rpc("produtos_custos") : Promise.resolve({ data: [] as { id: number; custo: number | null; mi_objetivo: number | null }[] }),
  ]);
  const produtos = (data ?? []) as Produto[];
  const mapaCustos = new Map(((custos.data ?? []) as { id: number; custo: number | null; mi_objetivo: number | null }[]).map((c) => [c.id, c]));

  const colunas = [
    { nome: "Produto" }, { nome: "Código" }, { nome: "Embalagem" }, { nome: "Preço kit", direita: true }, { nome: "IPI", direita: true },
    { nome: "R$/kg ICMS 7%", direita: true }, { nome: "ICMS 12%", direita: true }, { nome: "ICMS 18%", direita: true },
    ...(verCustos ? [{ nome: "Custo/kg", direita: true }, { nome: "% MI", direita: true }] : []),
    { nome: "Tabela" },
  ];
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (termo) u.set("q", termo);
    if (tabela) u.set("tabela", tabela);
    if (p > 1) u.set("pagina", String(p));
    return `/precos${u.size ? `?${u}` : ""}`;
  };
  const kg = (v: number | null) => (v == null ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <div className="mx-auto max-w-[1400px]">
      <form action="/precos" className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apagado" />
          <input name="q" defaultValue={termo} placeholder="Produto, código TOTVS ou grupo" className={`${classeCampo} pl-9`} />
        </div>
        <div className="inline-flex rounded-lg border border-linha bg-white p-1" role="group" aria-label="Tabela">
          {[["", "Todas"], ["rad", "RAD"], ["aditivo", "Aditivos"]].map(([v, n]) => (
            <Link
              key={v}
              href={`/precos?${new URLSearchParams({ ...(termo ? { q: termo } : {}), ...(v ? { tabela: v } : {}) })}`}
              className={`flex h-8 items-center rounded-md px-4 text-sm font-medium ${tabela === v ? "bg-ceu text-marinho" : "text-apagado hover:text-marinho"}`}
            >
              {n}
            </Link>
          ))}
        </div>
        <input type="hidden" name="tabela" value={tabela} />
        <button className={classeBotao.secundario}>Buscar</button>
        {editar && (
          <Link href="/precos/novo" className={`${classeBotao.primario} ml-auto`}>
            <Plus className="size-4" /> Novo produto
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-linha bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[14px]">
            <CabecalhoTabela colunas={colunas} />
            <tbody className="divide-y divide-linha/70">
              {produtos.map((p) => {
                const c = mapaCustos.get(p.id);
                return (
                  <tr key={p.id} className="hover:bg-nevoa/70">
                    <td className="max-w-[300px] px-4 py-2.5">
                      {editar ? (
                        <Link href={`/precos/${p.id}`} className="block truncate font-medium text-marinho hover:underline">{p.nome}</Link>
                      ) : (
                        <span className="block truncate font-medium text-tinta">{p.nome}</span>
                      )}
                      {p.grupo && <span className="block truncate text-[12px] text-apagado">{p.grupo}</span>}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-tinta/90">{p.codigo_totvs ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-tinta/90">{p.embalagem ?? "—"}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right font-semibold text-marinho">{moeda(p.preco)}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right text-tinta/90">{percentual(p.ipi, 2)}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right text-tinta/90">{kg(p.preco_icms_7)}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right text-tinta/90">{kg(p.preco_icms_12)}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right text-tinta/90">{kg(p.preco_icms_18)}</td>
                    {verCustos && <td className="num whitespace-nowrap px-4 py-2.5 text-right text-tinta/90">{kg(c?.custo ?? null)}</td>}
                    {verCustos && <td className="num whitespace-nowrap px-4 py-2.5 text-right text-tinta/90">{percentual(c?.mi_objetivo ?? null, 1)}</td>}
                    <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-apagado">{p.tipo_tabela === "rad" ? "RAD" : "Aditivos"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {produtos.length === 0 && <Vazio icone={Tags} titulo="Nenhum produto encontrado" texto="Tente outro nome ou código, ou limpe os filtros." />}
        <Paginacao pagina={pagina} total={count ?? 0} porPagina={POR_PAGINA} href={href} />
      </div>
      {verCustos && (
        <p className="mt-3 text-[13px] text-apagado">Custo e % MI aparecem só para Diretoria e Admin.</p>
      )}
    </div>
  );
}
