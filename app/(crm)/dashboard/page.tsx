import type { Metadata } from "next";
import Link from "next/link";
import { Clock, FileText } from "lucide-react";
import { Cartao, SeloDias } from "@/components/ui";
import { Vazio } from "@/components/Vazio";
import { ESTAGIOS, ESTAGIOS_ABERTOS, nomeEstagio, corEstagio } from "@/lib/dominio";
import { diasDesde, inteiro, moeda, moedaCurta, dataHora } from "@/lib/formatos";
import { obterSessao } from "@/lib/sessao";

export const metadata: Metadata = { title: "Dashboard" };

type Resumo = { estagio: string; quantidade: number; valor: number; ganho_estimado: number; paradas_7d: number };
type PropostaLista = {
  id: number;
  codigo: string;
  estagio: string;
  valor: number;
  estagio_desde: string;
  atualizado_em: string;
  cliente: { razao_social: string } | null;
  representante: { nome: string } | null;
};

const ESCOPO: Record<string, string> = {
  diretoria: "Você vê todas as propostas da empresa.",
  admin: "Você vê todas as propostas da empresa.",
  coordenacao: "Você vê as propostas de toda a equipe.",
  financeiro: "Você vê todas as propostas para análise financeira.",
  conferente: "Você vê a fila de propostas aguardando checagem.",
  operacional: "Você vê as propostas da sua carteira.",
  producao: "O módulo de Produção chega numa próxima fase. Por enquanto seu perfil não acessa dados comerciais.",
};

export default async function Dashboard() {
  const { supabase, usuario } = await obterSessao();
  const campos = "id, codigo, estagio, valor, estagio_desde, atualizado_em, cliente:clientes(razao_social), representante:usuarios!propostas_representante_id_fkey(nome)";

  const [{ data: resumo }, { data: paradas }, { data: ultimas }] = await Promise.all([
    supabase.rpc("resumo_pipeline"),
    supabase.from("propostas").select(campos).in("estagio", ESTAGIOS_ABERTOS).order("estagio_desde", { ascending: true }).limit(6),
    supabase.from("propostas").select(campos).order("atualizado_em", { ascending: false }).limit(6),
  ]);

  const linhas = (resumo ?? []) as Resumo[];
  const porEstagio = new Map(linhas.map((r) => [r.estagio, r]));
  const abertas = linhas.filter((r) => (ESTAGIOS_ABERTOS as string[]).includes(r.estagio));
  const soma = (k: keyof Resumo) => abertas.reduce((s, r) => s + Number(r[k]), 0);
  const maxQtd = Math.max(1, ...linhas.map((r) => Number(r.quantidade)));

  const indicadores = [
    { nome: "Propostas em aberto", valor: inteiro(soma("quantidade")), ajuda: "Da criação até amostra aprovada" },
    { nome: "Valor em negociação", valor: moedaCurta(soma("valor")), ajuda: moeda(soma("valor")) },
    { nome: "Ganho estimado", valor: moedaCurta(soma("ganho_estimado")), ajuda: "Valor × possibilidade de fechamento" },
    { nome: "Paradas há mais de 7 dias", valor: inteiro(soma("paradas_7d")), ajuda: "Propostas abertas sem andamento", alerta: soma("paradas_7d") > 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-marinho">Olá, {usuario?.nome.split(" ")[0]}</h2>
        <p className="mt-1 text-[15px] text-apagado">{ESCOPO[usuario?.perfil ?? ""] ?? ""}</p>
      </div>

      <section aria-label="Indicadores" className="grid gap-px overflow-hidden rounded-xl border border-linha bg-linha sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((i) => (
          <div key={i.nome} className="bg-white px-5 py-4">
            <p className="text-sm font-medium text-apagado">{i.nome}</p>
            <p className={`num mt-2 text-[28px] font-semibold leading-none ${i.alerta ? "text-[#9a3a40]" : "text-marinho"}`}>{i.valor}</p>
            <p className="num mt-2 text-[13px] text-apagado/90">{i.ajuda}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Cartao titulo="Propostas por estágio" acao={<Link href="/pipeline" className="text-sm font-medium text-azul hover:underline">Abrir pipeline</Link>}>
          <ul className="divide-y divide-linha/70 px-5">
            {ESTAGIOS.map((e) => {
              const r = porEstagio.get(e.id);
              const qtd = Number(r?.quantidade ?? 0);
              return (
                <li key={e.id} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 py-3 sm:grid-cols-[13rem_1fr_7rem_3rem]">
                  <span className="flex min-w-0 items-center gap-2.5 text-[15px] text-tinta">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.cor }} />
                    <span className="truncate">{e.nome}</span>
                  </span>
                  <span className="h-2 rounded-full bg-nevoa">
                    <span className="block h-2 rounded-full" style={{ width: `${(qtd / maxQtd) * 100}%`, background: e.cor }} />
                  </span>
                  <span className="num hidden text-right text-sm text-apagado sm:block">{moedaCurta(r?.valor ?? 0)}</span>
                  <span className="num text-right text-sm font-semibold text-marinho">{inteiro(qtd)}</span>
                </li>
              );
            })}
          </ul>
        </Cartao>

        <div className="grid content-start gap-6">
          <Cartao titulo="Mais tempo sem andamento">
            {(paradas ?? []).length === 0 ? (
              <Vazio icone={Clock} titulo="Nenhuma proposta parada" texto="Todas as propostas abertas andaram recentemente." />
            ) : (
              <ListaPropostas itens={paradas as unknown as PropostaLista[]} mostrarDias />
            )}
          </Cartao>
          <Cartao titulo="Atualizadas recentemente">
            {(ultimas ?? []).length === 0 ? (
              <Vazio icone={FileText} titulo="Sem propostas ainda" texto="As propostas mais recentes vão aparecer aqui." />
            ) : (
              <ListaPropostas itens={ultimas as unknown as PropostaLista[]} />
            )}
          </Cartao>
        </div>
      </div>
    </div>
  );
}

function ListaPropostas({ itens, mostrarDias }: { itens: PropostaLista[]; mostrarDias?: boolean }) {
  return (
    <ul className="divide-y divide-linha/70">
      {itens.map((p) => (
        <li key={p.id}>
          <Link href={`/pipeline/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-nevoa">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: corEstagio(p.estagio) }} title={nomeEstagio(p.estagio)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium text-tinta">{p.cliente?.razao_social ?? "Cliente não informado"}</span>
              <span className="block truncate text-[13px] text-apagado">
                {nomeEstagio(p.estagio)} · {p.representante?.nome ?? "—"}
                {!mostrarDias && ` · ${dataHora(p.atualizado_em)}`}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="num text-sm font-semibold text-marinho">{moeda(p.valor)}</span>
              {mostrarDias && <SeloDias dias={diasDesde(p.estagio_desde)} />}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
