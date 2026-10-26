import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BotaoEnviar, Formulario } from "@/components/Formulario";
import { CamposProposta } from "@/components/CamposProposta";
import { Cartao, Campo, Selo, SeloDias, classeCampo } from "@/components/ui";
import { ESTAGIOS, ESTAGIOS_ABERTOS, corEstagio, nomeEstagio, nomeTipoVendedor } from "@/lib/dominio";
import { data, dataHora, diasDesde, moeda, percentual } from "@/lib/formatos";
import { obterSessao, pode } from "@/lib/sessao";
import { moverEstagio, registrarParecer, salvarProposta } from "../acoes";

export const metadata: Metadata = { title: "Proposta" };

type Proposta = {
  id: number; codigo: string; estagio: string; estagio_desde: string; valor: number; possibilidade: number | null;
  ganho_estimado: number | null; data_fechamento: string | null; cond_pagamento: string | null; observacao: string | null;
  tipo_tabela: "rad" | "aditivo" | null; dmp: number | null; com_cce: boolean; criado_em: string; validado_em: string | null;
  parecer_financeiro: string | null; parecer_financeiro_obs: string | null; parecer_financeiro_em: string | null;
  criado_por_original: string | null; criado_por: string | null;
  cliente: { id: number; razao_social: string; cnpj: string | null; cpf: string | null; cidade: string | null; uf: string | null } | null;
  representante: { nome: string; tipo_vendedor: string | null } | null;
  autor: { nome: string } | null;
  validador: { nome: string } | null;
  parecerista: { nome: string } | null;
};

export default async function DetalheProposta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, usuario } = await obterSessao();

  const { data: p } = await supabase
    .from("propostas")
    .select(`*, cliente:clientes(id, razao_social, cnpj, cpf, cidade, uf),
      representante:usuarios!propostas_representante_id_fkey(nome, tipo_vendedor),
      autor:usuarios!propostas_criado_por_fkey(nome),
      validador:usuarios!propostas_validado_por_fkey(nome),
      parecerista:usuarios!propostas_parecer_financeiro_por_fkey(nome)`)
    .eq("id", Number(id))
    .maybeSingle<Proposta>();
  if (!p) notFound();

  const [{ data: historico }, comissao] = await Promise.all([
    supabase
      .from("historico_estagios")
      .select("id, de, para, alterado_em, quem:usuarios!historico_estagios_alterado_por_fkey(nome)")
      .eq("proposta_id", p.id)
      .order("alterado_em", { ascending: false }),
    p.tipo_tabela && p.dmp != null && (p.representante?.tipo_vendedor === "representante" || p.representante?.tipo_vendedor === "vendedor_interno")
      ? supabase
          .rpc("calcular_comissao", { p_dmp: p.dmp, p_tipo_tabela: p.tipo_tabela, p_tipo_vendedor: p.representante.tipo_vendedor, p_com_cce: p.com_cce })
          .single<{ percentual: number | null; percentual_cce: number; exige_autorizacao_diretoria: boolean }>()
      : Promise.resolve({ data: null }),
  ]);

  const aberto = (ESTAGIOS_ABERTOS as string[]).includes(p.estagio);
  const perfil = usuario?.perfil;
  const ehAutor = !!usuario && p.criado_por === usuario.id;
  const c = comissao.data;

  const info: [string, React.ReactNode][] = [
    ["Vendedor", p.representante ? `${p.representante.nome} (${nomeTipoVendedor(p.representante.tipo_vendedor)})` : "—"],
    ["Criada por", p.autor?.nome ?? p.criado_por_original ?? "—"],
    ["Criada em", data(p.criado_em)],
    ["Validada por", p.validador ? `${p.validador.nome} em ${dataHora(p.validado_em)}` : "—"],
    ["Previsão de fechamento", data(p.data_fechamento)],
    ["Condição de pagamento", p.cond_pagamento ?? "—"],
    ["Possibilidade", percentual(p.possibilidade, 0)],
    ["Ganho estimado", moeda(Number(p.valor) * Number(p.possibilidade ?? 0) / 100)],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/pipeline" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-azul hover:underline">
        <ArrowLeft className="size-4" /> Voltar ao pipeline
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="num text-sm text-apagado">Proposta {p.codigo}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-marinho">
            {p.cliente ? (
              <Link href={`/contatos/${p.cliente.id}`} className="hover:underline">{p.cliente.razao_social}</Link>
            ) : "Cliente não informado"}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Selo cor={corEstagio(p.estagio)}>{nomeEstagio(p.estagio)}</Selo>
            <SeloDias dias={diasDesde(p.estagio_desde)} aberto={aberto} />
            {p.parecer_financeiro && (
              <Selo cor={p.parecer_financeiro === "recomendado" ? "#1F9D8A" : "#B4545A"}>
                Financeiro: {p.parecer_financeiro === "recomendado" ? "recomendado" : "não recomendado"}
              </Selo>
            )}
          </div>
        </div>
        <p className="num text-[32px] font-semibold leading-none text-marinho">{moeda(p.valor)}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-6">
          <Cartao titulo="Dados da proposta">
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[13px] text-apagado">{k}</dt>
                  <dd className="mt-0.5 text-[15px] text-tinta">{v}</dd>
                </div>
              ))}
            </dl>
            {p.observacao && (
              <div className="border-t border-linha px-5 py-4">
                <p className="text-[13px] text-apagado">Observação</p>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-tinta">{p.observacao}</p>
              </div>
            )}
          </Cartao>

          {pode.criarProposta(perfil) ? (
            <Cartao titulo="Editar proposta">
              <Formulario acao={salvarProposta} className="p-5">
                <input type="hidden" name="id" value={p.id} />
                <CamposProposta valores={p} />
                <div className="mt-5 flex justify-end">
                  <BotaoEnviar>Salvar alterações</BotaoEnviar>
                </div>
              </Formulario>
            </Cartao>
          ) : null}
        </div>

        <div className="grid content-start gap-6">
          <Cartao titulo="Mover de estágio">
            <Formulario acao={moverEstagio} className="p-5">
              <input type="hidden" name="id" value={p.id} />
              <div className="flex gap-2">
                <select name="estagio" defaultValue="" required className={classeCampo} aria-label="Novo estágio">
                  <option value="" disabled>Escolha o novo estágio</option>
                  {ESTAGIOS.filter((e) => e.id !== p.estagio).map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
                <BotaoEnviar>Mover</BotaoEnviar>
              </div>
              {ehAutor && p.estagio !== "validado" && (
                <p className="mt-3 flex gap-2 text-[13px] leading-relaxed text-apagado">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-azul" />
                  Você criou esta proposta, então a validação precisa ser feita por outro usuário.
                </p>
              )}
            </Formulario>
          </Cartao>

          <Cartao titulo="Comissão">
            <div className="p-5">
              {!p.tipo_tabela || p.dmp == null ? (
                <p className="text-[15px] text-apagado">Informe a tabela e o DMP da proposta para calcular a comissão.</p>
              ) : !c ? (
                <p className="text-[15px] text-apagado">O vendedor desta proposta não tem tipo com regra de comissão (representante ou vendedor interno).</p>
              ) : (
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[13px] text-apagado">Tabela / DMP</dt>
                    <dd className="num mt-0.5 text-[15px] text-tinta">{p.tipo_tabela === "rad" ? "RAD" : "Aditivos"} · {percentual(Number(p.dmp) * 100, 2)}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-apagado">Comissão</dt>
                    <dd className="num mt-0.5 text-[15px] font-semibold text-marinho">
                      {percentual(Number(c.percentual) * 100, 2)} = {moeda(Number(p.valor) * Number(c.percentual))}
                    </dd>
                  </div>
                  {p.com_cce && (
                    <div>
                      <dt className="text-[13px] text-apagado">CCE</dt>
                      <dd className="num mt-0.5 text-[15px] text-tinta">{percentual(Number(c.percentual_cce) * 100, 2)} = {moeda(Number(p.valor) * Number(c.percentual_cce))}</dd>
                    </div>
                  )}
                  {c.exige_autorizacao_diretoria && (
                    <p className="col-span-2 rounded-lg bg-[#fdf3e3] px-3 py-2 text-sm text-[#8a5a12]">
                      Desconto acima do máximo da tabela: precisa de autorização da Diretoria e a comissão fica em 1%.
                    </p>
                  )}
                </dl>
              )}
            </div>
          </Cartao>

          {pode.parecerFinanceiro(perfil) && (
            <Cartao titulo="Parecer financeiro">
              <Formulario acao={registrarParecer} className="p-5">
                <input type="hidden" name="id" value={p.id} />
                {p.parecerista && (
                  <p className="mb-3 text-[13px] text-apagado">Último parecer por {p.parecerista.nome} em {dataHora(p.parecer_financeiro_em)}.</p>
                )}
                <Campo rotulo="Observação (opcional)">
                  <textarea name="obs" defaultValue={p.parecer_financeiro_obs ?? ""} rows={2} className={`${classeCampo} h-auto py-2`} />
                </Campo>
                <div className="mt-3 flex flex-wrap gap-2">
                  <BotaoEnviar name="parecer" value="recomendado">Recomendado</BotaoEnviar>
                  <BotaoEnviar name="parecer" value="nao_recomendado" variante="perigo">Não recomendado</BotaoEnviar>
                </div>
              </Formulario>
            </Cartao>
          )}

          <Cartao titulo="Histórico de estágios">
            <ol className="relative px-5 py-4">
              {(historico ?? []).map((h, i) => (
                <li key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < (historico ?? []).length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-linha" />}
                  <span className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-white" style={{ background: corEstagio(h.para) }} />
                  <div className="min-w-0">
                    <p className="text-[15px] text-tinta">
                      {h.de ? <>{nomeEstagio(h.de)} → <strong className="font-semibold">{nomeEstagio(h.para)}</strong></> : <>Entrou em <strong className="font-semibold">{nomeEstagio(h.para)}</strong></>}
                    </p>
                    <p className="text-[13px] text-apagado">
                      {dataHora(h.alterado_em)}{(h.quem as unknown as { nome: string } | null)?.nome ? ` por ${(h.quem as unknown as { nome: string }).nome}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Cartao>
        </div>
      </div>
    </div>
  );
}
