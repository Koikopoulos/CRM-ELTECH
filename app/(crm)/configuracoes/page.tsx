import type { Metadata } from "next";
import { Percent, ShieldCheck, UserCog } from "lucide-react";
import { BotaoEnviar, Formulario } from "@/components/Formulario";
import { Cartao, classeCampo } from "@/components/ui";
import { PERFIS, TIPOS_VENDEDOR, nomePerfil, nomeTipoVendedor } from "@/lib/dominio";
import { obterSessao, pode } from "@/lib/sessao";
import { salvarRegras, salvarUsuario } from "./acoes";

export const metadata: Metadata = { title: "Configurações" };

type Regra = { id: number; com_cce: boolean; tipo_tabela: "rad" | "aditivo"; tipo_vendedor: "representante" | "vendedor_interno"; desconto_max: number; percentual: number };
const COLUNAS_REGRA = [
  { tabela: "rad", vendedor: "representante", nome: "RAD · Representante" },
  { tabela: "aditivo", vendedor: "representante", nome: "Aditivos · Representante" },
  { tabela: "rad", vendedor: "vendedor_interno", nome: "RAD · Vendedor interno" },
  { tabela: "aditivo", vendedor: "vendedor_interno", nome: "Aditivos · Vendedor interno" },
] as const;
const pct = (v: number) => Math.round(Number(v) * 10000) / 100;

export default async function Configuracoes() {
  const { supabase, usuario } = await obterSessao();
  const perfil = usuario?.perfil;
  const gerir = pode.gerirUsuarios(perfil);
  const editarRegras = pode.editarRegras(perfil);

  const [{ data: usuarios }, { data: regras }, { data: cce }, { data: params }] = await Promise.all([
    supabase.from("usuarios").select("id, nome, email, perfil, tipo_vendedor, ativo, auth_id").order("ativo", { ascending: false }).order("nome"),
    supabase.from("regras_comissao").select("*").order("desconto_max"),
    supabase.from("faixas_cce").select("*").order("desconto_max"),
    supabase.from("parametros_comerciais").select("*").order("chave"),
  ]);
  const listaRegras = (regras ?? []) as Regra[];
  const faixas = [...new Set(listaRegras.map((r) => Number(r.desconto_max)))].sort((a, b) => a - b);

  const tabelaRegras = (comCce: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-[14px]">
        <thead>
          <tr className="border-b border-linha bg-nevoa/70 text-left">
            <th scope="col" className="px-4 py-2.5 text-[13px] font-semibold text-apagado">DMP até</th>
            {COLUNAS_REGRA.map((c) => <th key={c.nome} scope="col" className="px-3 py-2.5 text-right text-[13px] font-semibold text-apagado">{c.nome}</th>)}
            {comCce && <th scope="col" className="px-3 py-2.5 text-right text-[13px] font-semibold text-apagado">CCE</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-linha/70">
          {faixas.map((f) => (
            <tr key={f}>
              <th scope="row" className="num px-4 py-2 text-left font-medium text-tinta">{pct(f).toLocaleString("pt-BR")}%</th>
              {COLUNAS_REGRA.map((c) => {
                const r = listaRegras.find((x) => x.com_cce === comCce && x.tipo_tabela === c.tabela && x.tipo_vendedor === c.vendedor && Number(x.desconto_max) === f);
                return (
                  <td key={c.nome} className="px-3 py-1.5 text-right">
                    {!r ? <span className="text-apagado/60">—</span> : editarRegras ? (
                      <input name={`regra_${r.id}`} type="number" step="0.01" min="0" max="100" defaultValue={pct(r.percentual)} aria-label={`${c.nome}, DMP até ${pct(f)}%`} className={`${classeCampo} num h-8 w-20 text-right`} />
                    ) : <span className="num">{pct(r.percentual).toLocaleString("pt-BR")}%</span>}
                  </td>
                );
              })}
              {comCce && (() => {
                const x = (cce ?? []).find((y) => Number(y.desconto_max) === f);
                return (
                  <td className="px-3 py-1.5 text-right">
                    {!x ? <span className="text-apagado/60">—</span> : editarRegras ? (
                      <input name={`cce_${x.id}`} type="number" step="0.01" min="0" max="100" defaultValue={pct(x.percentual)} aria-label={`CCE, DMP até ${pct(f)}%`} className={`${classeCampo} num h-8 w-20 text-right`} />
                    ) : <span className="num">{pct(x.percentual).toLocaleString("pt-BR")}%</span>}
                  </td>
                );
              })()}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <Cartao titulo="Usuários" acao={<UserCog className="size-5 text-azul" />}>
        <ul className="divide-y divide-linha/70">
          {(usuarios ?? []).map((u) => (
            <li key={u.id} className="px-5 py-3">
              {gerir && u.id !== usuario?.id ? (
                <Formulario acao={salvarUsuario} className="grid items-center gap-3 md:grid-cols-[1fr_190px_170px_auto_auto]">
                  <input type="hidden" name="id" value={u.id} />
                  <Identificacao nome={u.nome} email={u.email} ativo={u.ativo} temLogin={!!u.auth_id} />
                  <select name="perfil" defaultValue={u.perfil} aria-label={`Perfil de ${u.nome}`} className={classeCampo}>
                    {PERFIS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <select name="tipo_vendedor" defaultValue={u.tipo_vendedor ?? ""} aria-label={`Tipo de vendedor de ${u.nome}`} className={classeCampo}>
                    <option value="">Sem tipo</option>
                    {TIPOS_VENDEDOR.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-tinta">
                    <input type="checkbox" name="ativo" defaultChecked={u.ativo} className="size-4 accent-[#2d6bc4]" /> Ativo
                  </label>
                  <BotaoEnviar variante="secundario">Salvar</BotaoEnviar>
                </Formulario>
              ) : (
                <div className="grid items-center gap-3 md:grid-cols-[1fr_190px_170px]">
                  <Identificacao nome={u.nome} email={u.email} ativo={u.ativo} temLogin={!!u.auth_id} voce={u.id === usuario?.id} />
                  <span className="text-[15px] text-tinta">{nomePerfil(u.perfil)}</span>
                  <span className="text-[15px] text-apagado">{nomeTipoVendedor(u.tipo_vendedor)}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
        {gerir && (
          <p className="border-t border-linha px-5 py-3 text-[13px] leading-relaxed text-apagado">
            Ninguém altera o próprio perfil, e só a Diretoria concede o perfil Diretoria. O login de cada pessoa é criado no Supabase
            (Authentication) com o mesmo e-mail do cadastro e se liga sozinho ao usuário.
          </p>
        )}
      </Cartao>

      <Cartao titulo="Regras de comissão" acao={<Percent className="size-5 text-azul" />}>
        <Formulario acao={salvarRegras}>
          <div className="px-5 pt-4">
            <p className="text-[14px] leading-relaxed text-apagado">
              Cada faixa vale até o DMP indicado: DMP 0% usa a primeira linha; acima de 0% até 10%, a segunda; e assim por diante.
              {!editarRegras && " Seu perfil consulta as regras, sem alterar."}
            </p>
          </div>
          <h3 className="px-5 pb-2 pt-5 text-[15px] font-semibold text-marinho">Sem CCE</h3>
          {tabelaRegras(false)}
          <h3 className="px-5 pb-2 pt-6 text-[15px] font-semibold text-marinho">Com comissão complementar Eltech (CCE)</h3>
          {tabelaRegras(true)}
          <h3 className="px-5 pb-2 pt-6 text-[15px] font-semibold text-marinho">Limites</h3>
          <dl className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
            {(params ?? []).map((p) => (
              <div key={p.chave}>
                <dt className="text-[13px] text-apagado">{p.descricao}</dt>
                <dd className="mt-1">
                  {editarRegras ? (
                    <input name={`param_${p.chave}`} type="number" step="0.01" min="0" max="100" defaultValue={pct(p.valor)} aria-label={p.descricao} className={`${classeCampo} num h-9 w-24`} />
                  ) : <span className="num text-[15px] text-tinta">{pct(p.valor).toLocaleString("pt-BR")}%</span>}
                </dd>
              </div>
            ))}
          </dl>
          {editarRegras && (
            <div className="flex justify-end border-t border-linha px-5 py-4">
              <BotaoEnviar>Salvar regras</BotaoEnviar>
            </div>
          )}
        </Formulario>
      </Cartao>

      <Cartao titulo="Perfis de acesso" acao={<ShieldCheck className="size-5 text-azul" />}>
        <dl className="divide-y divide-linha/70">
          {PERFIS.map((p) => (
            <div key={p.id} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="flex items-center gap-2 text-[15px] font-semibold text-tinta">
                {p.nome}
                {p.fase && <span className="whitespace-nowrap rounded-full bg-nevoa px-2 py-0.5 text-xs font-medium text-apagado">{p.fase}</span>}
              </dt>
              <dd className="text-[15px] leading-relaxed text-apagado">{p.resumo}</dd>
            </div>
          ))}
        </dl>
      </Cartao>
    </div>
  );
}

function Identificacao({ nome, email, ativo, temLogin, voce }: { nome: string; email: string | null; ativo: boolean; temLogin: boolean; voce?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`truncate text-[15px] font-medium ${ativo ? "text-tinta" : "text-apagado line-through"}`}>
        {nome}
        {voce && <span className="ml-2 text-[13px] font-normal text-apagado">(você)</span>}
      </p>
      <p className="truncate text-[13px] text-apagado">
        {email ?? "Sem e-mail"} · {temLogin ? "login ativo" : "sem login criado"}
      </p>
    </div>
  );
}
