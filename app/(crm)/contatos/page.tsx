import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { CabecalhoTabela } from "@/components/Tabela";
import { Paginacao, classeBotao, classeCampo, classeFiltro } from "@/components/ui";
import { Vazio } from "@/components/Vazio";
import { obterSessao, pode } from "@/lib/sessao";

export const metadata: Metadata = { title: "Contatos" };

const POR_PAGINA = 25;
const COLUNAS = [
  { nome: "Empresa" }, { nome: "CNPJ / CPF" }, { nome: "Segmento" }, { nome: "Cidade / UF" },
  { nome: "Vendedor" }, { nome: "Status" },
];

type Linha = {
  id: number; razao_social: string; nome_fantasia: string | null; cnpj: string | null; cpf: string | null;
  segmento_original: string | null; cidade: string | null; uf: string | null; status: string | null;
  representante: { nome: string } | null;
};

export default async function Contatos({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string; vendedor?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const termo = (sp.q ?? "").replace(/[,()*%\\]/g, " ").trim().slice(0, 80);
  const tipo = sp.tipo === "juridica" || sp.tipo === "fisica" ? sp.tipo : "";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const { supabase, usuario } = await obterSessao();
  const visaoAmpla = usuario && usuario.perfil !== "operacional";

  let q = supabase
    .from("clientes")
    .select("id, razao_social, nome_fantasia, cnpj, cpf, segmento_original, cidade, uf, status, representante:usuarios!clientes_representante_id_fkey(nome)", { count: "exact" })
    .order("razao_social")
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  if (termo) q = q.or(`razao_social.ilike.%${termo}%,nome_fantasia.ilike.%${termo}%,cnpj.ilike.%${termo}%,cpf.ilike.%${termo}%,cidade.ilike.%${termo}%`);
  if (tipo) q = q.eq("tipo_pessoa", tipo);
  if (sp.vendedor) q = q.eq("representante_id", sp.vendedor);

  const [{ data, count }, { data: vendedores }] = await Promise.all([
    q,
    visaoAmpla
      ? supabase.from("usuarios").select("id, nome").eq("ativo", true).in("tipo_vendedor", ["representante", "vendedor_interno"]).order("nome")
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ]);
  const linhas = (data ?? []) as unknown as Linha[];

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (termo) u.set("q", termo);
    if (tipo) u.set("tipo", tipo);
    if (sp.vendedor) u.set("vendedor", sp.vendedor);
    if (p > 1) u.set("pagina", String(p));
    return `/contatos${u.size ? `?${u}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <form action="/contatos" className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apagado" />
          <input name="q" defaultValue={termo} placeholder="Nome, CNPJ, CPF ou cidade" className={`${classeCampo} pl-9`} />
        </div>
        <select name="tipo" defaultValue={tipo} className={classeFiltro} aria-label="Tipo de pessoa">
          <option value="">Pessoa física e jurídica</option>
          <option value="juridica">Pessoa jurídica</option>
          <option value="fisica">Pessoa física</option>
        </select>
        {visaoAmpla && (
          <select name="vendedor" defaultValue={sp.vendedor ?? ""} className={`${classeFiltro} min-w-52`} aria-label="Vendedor">
            <option value="">Todos os vendedores</option>
            {(vendedores ?? []).map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
          </select>
        )}
        <button className={classeBotao.secundario}>Buscar</button>
        {pode.criarCliente(usuario?.perfil) && (
          <Link href="/contatos/novo" className={`${classeBotao.primario} ml-auto`}>
            <Plus className="size-4" /> Novo cliente
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-linha bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[15px]">
            <CabecalhoTabela colunas={COLUNAS} />
            <tbody className="divide-y divide-linha/70">
              {linhas.map((c) => (
                <tr key={c.id} className="hover:bg-nevoa/70">
                  <td className="max-w-[320px] px-4 py-3">
                    <Link href={`/contatos/${c.id}`} className="block truncate font-medium text-marinho hover:underline">{c.razao_social}</Link>
                    {c.nome_fantasia && c.nome_fantasia !== c.razao_social && (
                      <span className="block truncate text-[13px] text-apagado">{c.nome_fantasia}</span>
                    )}
                  </td>
                  <td className="num whitespace-nowrap px-4 py-3 text-tinta/90">{c.cnpj ?? c.cpf ?? "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-tinta/90">{c.segmento_original ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-tinta/90">{[c.cidade, c.uf].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-tinta/90">{c.representante?.nome ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-apagado">{c.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {linhas.length === 0 && (
          <Vazio
            icone={Users}
            titulo={termo || tipo || sp.vendedor ? "Nenhum cliente encontrado" : "Nenhum cliente na sua carteira"}
            texto={termo || tipo || sp.vendedor ? "Tente outro nome, documento ou cidade, ou limpe os filtros." : "Os clientes cadastrados para você aparecem aqui."}
          />
        )}
        <Paginacao pagina={pagina} total={count ?? 0} porPagina={POR_PAGINA} href={href} />
      </div>
    </div>
  );
}
