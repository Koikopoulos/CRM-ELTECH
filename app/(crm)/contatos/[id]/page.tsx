import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { CamposCliente, type Cliente } from "@/components/CamposCliente";
import { BotaoEnviar, Formulario } from "@/components/Formulario";
import { Cartao, Selo, classeBotao } from "@/components/ui";
import { Vazio } from "@/components/Vazio";
import { corEstagio, nomeEstagio } from "@/lib/dominio";
import { data, moeda } from "@/lib/formatos";
import { obterSessao, pode } from "@/lib/sessao";
import { salvarCliente } from "../acoes";

export const metadata: Metadata = { title: "Cliente" };

export default async function DetalheCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, usuario } = await obterSessao();
  const perfil = usuario?.perfil;

  const [{ data: c }, { data: propostas }, { data: vendedores }, { data: segmentos }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", Number(id)).maybeSingle<Cliente & { razao_social: string }>(),
    supabase.from("propostas").select("id, codigo, estagio, valor, criado_em").eq("cliente_id", Number(id)).order("criado_em", { ascending: false }).limit(50),
    supabase.from("usuarios").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("segmentos").select("id, nome").order("nome"),
  ]);
  if (!c) notFound();

  const editaGerais = perfil === "diretoria" || perfil === "admin" || perfil === "operacional";
  const editaFaturamento = editaGerais || perfil === "financeiro";
  const podeSalvar = pode.editarCliente(perfil);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/contatos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-azul hover:underline">
        <ArrowLeft className="size-4" /> Voltar aos contatos
      </Link>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-sm text-apagado">{c.cnpj ?? c.cpf ?? "Sem documento"}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-marinho">{c.razao_social}</h2>
          <p className="mt-1 text-[15px] text-apagado">{[c.cidade, c.uf].filter(Boolean).join(" / ")}</p>
        </div>
        {pode.criarProposta(perfil) && (
          <Link href={`/pipeline/nova?cliente=${c.id}`} className={classeBotao.primario}>
            <Plus className="size-4" /> Nova proposta
          </Link>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Cartao titulo={podeSalvar ? "Cadastro" : "Cadastro (somente consulta)"}>
          <Formulario acao={salvarCliente} className="p-5">
            <input type="hidden" name="id" value={c.id} />
            {perfil === "financeiro" && (
              <p className="mb-5 rounded-lg bg-nevoa px-3.5 py-2.5 text-[13px] text-apagado">O perfil Financeiro altera apenas os dados de faturamento.</p>
            )}
            <CamposCliente
              c={c}
              geraisBloqueados={!editaGerais}
              faturamentoBloqueado={!editaFaturamento}
              vendedores={vendedores ?? []}
              escolherVendedor={perfil === "diretoria" || perfil === "admin"}
              segmentos={segmentos ?? []}
            />
            {podeSalvar && (
              <div className="mt-6 flex justify-end">
                <BotaoEnviar>Salvar cadastro</BotaoEnviar>
              </div>
            )}
          </Formulario>
        </Cartao>

        <Cartao titulo={`Propostas (${(propostas ?? []).length})`}>
          {(propostas ?? []).length === 0 ? (
            <Vazio icone={FileText} titulo="Nenhuma proposta" texto="As propostas deste cliente que você pode ver aparecem aqui." />
          ) : (
            <ul className="divide-y divide-linha/70">
              {(propostas ?? []).map((p) => (
                <li key={p.id}>
                  <Link href={`/pipeline/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-nevoa">
                    <span className="min-w-0">
                      <span className="num block text-[15px] font-medium text-tinta">{p.codigo}</span>
                      <span className="text-[13px] text-apagado">{data(p.criado_em)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="num text-sm font-semibold text-marinho">{moeda(p.valor)}</span>
                      <Selo cor={corEstagio(p.estagio)}>{nomeEstagio(p.estagio)}</Selo>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}
