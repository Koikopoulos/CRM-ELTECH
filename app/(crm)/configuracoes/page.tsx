import type { Metadata } from "next";
import { Percent, ShieldCheck, UserCog } from "lucide-react";
import { PERFIS } from "@/lib/dominio";

export const metadata: Metadata = { title: "Configurações" };

const SECOES = [
  { icone: UserCog, nome: "Usuários", texto: "Convidar usuários, definir perfil e tipo de vendedor (representante, interno ou retaguarda)." },
  { icone: Percent, nome: "Regras de comissão", texto: "Faixas por desconto médio ponderado (DMP), tipo de tabela e tipo de vendedor, com e sem CCE." },
];

export default function Configuracoes() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {SECOES.map(({ icone: Icone, nome, texto }) => (
          <div key={nome} className="rounded-xl border border-linha bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-ceu text-azul">
                <Icone className="size-5" />
              </span>
              <h2 className="text-base font-semibold text-marinho">{nome}</h2>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-apagado">{texto}</p>
            <p className="mt-4 text-[13px] font-medium text-azul">Disponível após a criação do banco</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-linha bg-white">
        <header className="flex items-center gap-3 border-b border-linha px-5 py-4">
          <ShieldCheck className="size-5 text-azul" />
          <div>
            <h2 className="text-base font-semibold text-marinho">Perfis de acesso</h2>
            <p className="text-[13px] text-apagado">O que cada perfil pode ver e fazer no CRM</p>
          </div>
        </header>
        <dl className="divide-y divide-linha/70">
          {PERFIS.map((p) => (
            <div key={p.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="flex items-center gap-2 text-[15px] font-semibold text-tinta">
                {p.nome}
                {p.fase && (
                  <span className="whitespace-nowrap rounded-full bg-nevoa px-2 py-0.5 text-xs font-medium text-apagado">{p.fase}</span>
                )}
              </dt>
              <dd className="text-[15px] leading-relaxed text-apagado">{p.resumo}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
