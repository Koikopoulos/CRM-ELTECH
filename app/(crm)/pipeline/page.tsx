import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { SeloDias, classeBotao, classeCampo, classeFiltro } from "@/components/ui";
import { ESTAGIOS, ESTAGIOS_ABERTOS } from "@/lib/dominio";
import { diasDesde, inteiro, moeda, moedaCurta } from "@/lib/formatos";
import { obterSessao, pode } from "@/lib/sessao";

export const metadata: Metadata = { title: "Pipeline de vendas" };

const POR_COLUNA = 40;

type Cartao = {
  id: number;
  codigo: string;
  valor: number;
  estagio_desde: string;
  cliente: { razao_social: string } | null;
  representante: { nome: string } | null;
};

export default async function Pipeline({ searchParams }: { searchParams: Promise<{ busca?: string; vendedor?: string }> }) {
  const { busca: buscaBruta = "", vendedor = "" } = await searchParams;
  // Remove caracteres que têm significado nos filtros do banco.
  const busca = buscaBruta.replace(/[,()*%\\:."']/g, " ").trim().slice(0, 80);
  const { supabase, usuario } = await obterSessao();
  const visaoAmpla = usuario && usuario.perfil !== "operacional";

  const { data: vendedores } = visaoAmpla
    ? await supabase.from("usuarios").select("id, nome").eq("ativo", true).in("tipo_vendedor", ["representante", "vendedor_interno"]).order("nome")
    : { data: [] };

  let idsClientes: number[] | null = null;
  if (busca) {
    const { data } = await supabase.from("clientes").select("id").ilike("razao_social", `%${busca}%`).limit(200);
    idsClientes = (data ?? []).map((c) => c.id);
  }

  const colunas = await Promise.all(
    ESTAGIOS.map(async (e) => {
      const aberto = (ESTAGIOS_ABERTOS as string[]).includes(e.id);
      let q = supabase
        .from("propostas")
        .select("id, codigo, valor, estagio_desde, cliente:clientes(razao_social), representante:usuarios!propostas_representante_id_fkey(nome)", { count: "exact" })
        .eq("estagio", e.id)
        .order("estagio_desde", { ascending: aberto })
        .limit(POR_COLUNA);
      if (vendedor) q = q.eq("representante_id", vendedor);
      if (busca) q = idsClientes!.length ? q.or(`codigo.ilike.%${busca}%,cliente_id.in.(${idsClientes!.join(",")})`) : q.ilike("codigo", `%${busca}%`);
      const { data, count } = await q;
      const itens = (data ?? []) as unknown as Cartao[];
      return { ...e, aberto, itens, total: count ?? 0, soma: itens.reduce((s, c) => s + Number(c.valor), 0) };
    }),
  );

  return (
    <div className="flex h-full flex-col">
      <form className="mb-4 flex flex-wrap items-center gap-3" action="/pipeline">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apagado" />
          <input name="busca" defaultValue={busca} placeholder="Cliente ou código da proposta" className={`${classeCampo} pl-9`} />
        </div>
        {visaoAmpla && (
          <select name="vendedor" defaultValue={vendedor} className={`${classeFiltro} min-w-52`} aria-label="Vendedor">
            <option value="">Todos os vendedores</option>
            {(vendedores ?? []).map((v) => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}
        <button className={classeBotao.secundario}>Filtrar</button>
        {(busca || vendedor) && (
          <Link href="/pipeline" className="text-sm font-medium text-azul hover:underline">Limpar filtros</Link>
        )}
        {pode.criarProposta(usuario?.perfil) && (
          <Link href="/pipeline/nova" className={`${classeBotao.primario} ml-auto`}>
            <Plus className="size-4" /> Nova proposta
          </Link>
        )}
      </form>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-h-[480px] gap-4">
          {colunas.map((c) => (
            <section key={c.id} aria-label={c.nome} className="flex w-[280px] shrink-0 flex-col rounded-xl bg-[#edf3fa]">
              <header className="px-3.5 pb-2 pt-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: c.cor }} />
                  <h2 className="flex-1 truncate text-[15px] font-semibold text-marinho">{c.nome}</h2>
                  <span className="num rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-apagado">{inteiro(c.total)}</span>
                </div>
                <p className="num mt-1 pl-[18px] text-[13px] text-apagado">
                  {moedaCurta(c.soma)}
                  {c.total > c.itens.length && ` nos ${c.itens.length} exibidos`}
                </p>
              </header>
              <ol className="flex flex-1 flex-col gap-2 px-2 pb-2">
                {c.itens.length === 0 && (
                  <li className="rounded-lg border border-dashed border-linha px-3 py-8 text-center text-[13px] text-apagado/80">
                    Nenhuma proposta neste estágio
                  </li>
                )}
                {c.itens.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/pipeline/${p.id}`}
                      className="block rounded-lg border border-transparent bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(32,49,103,0.06)] transition-colors hover:border-azul/40"
                    >
                      <span className="line-clamp-2 text-[14px] font-medium leading-snug text-tinta">
                        {p.cliente?.razao_social ?? "Cliente não informado"}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="num text-[14px] font-semibold text-marinho">{moeda(p.valor)}</span>
                        <SeloDias dias={diasDesde(p.estagio_desde)} aberto={c.aberto} />
                      </span>
                      <span className="mt-1 flex justify-between gap-2 text-[12px] text-apagado">
                        <span className="truncate">{p.representante?.nome ?? "—"}</span>
                        <span className="num shrink-0">{p.codigo}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
