import type { Metadata } from "next";
import { Clock, FileText } from "lucide-react";
import { AvisoEtapa } from "@/components/AvisoEtapa";
import { Vazio } from "@/components/Vazio";
import { ESTAGIOS } from "@/lib/dominio";

export const metadata: Metadata = { title: "Dashboard" };

const INDICADORES = [
  { nome: "Propostas em aberto", ajuda: "Criação, checagem, validado, enviado e amostras" },
  { nome: "Valor em negociação", ajuda: "Soma das propostas em aberto" },
  { nome: "Ganho estimado", ajuda: "Valor × possibilidade de fechamento" },
  { nome: "Clientes sem contato", ajuda: "Mais de 30 dias sem interação" },
];

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <AvisoEtapa>
        Os números aparecem quando a base da planilha for importada. Cada usuário verá apenas os dados
        permitidos pelo seu perfil.
      </AvisoEtapa>

      <section aria-label="Indicadores" className="grid gap-px overflow-hidden rounded-xl border border-linha bg-linha sm:grid-cols-2 xl:grid-cols-4">
        {INDICADORES.map((i) => (
          <div key={i.nome} className="bg-white px-5 py-4">
            <p className="text-sm font-medium text-apagado">{i.nome}</p>
            <p className="num mt-2 text-[28px] font-semibold leading-none text-marinho/30">—</p>
            <p className="mt-2 text-[13px] text-apagado/80">{i.ajuda}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-linha bg-white">
          <header className="flex items-center justify-between border-b border-linha px-5 py-4">
            <h2 className="text-base font-semibold text-marinho">Propostas por estágio</h2>
            <span className="text-[13px] text-apagado">Últimos 90 dias</span>
          </header>
          <ul className="divide-y divide-linha/70 px-5">
            {ESTAGIOS.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.cor }} />
                <span className="w-48 shrink-0 text-[15px] text-tinta">{e.nome}</span>
                <span className="h-2 flex-1 rounded-full bg-nevoa" />
                <span className="num w-10 text-right text-sm text-apagado">0</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6">
          <section className="rounded-xl border border-linha bg-white">
            <header className="border-b border-linha px-5 py-4">
              <h2 className="text-base font-semibold text-marinho">Propostas paradas</h2>
            </header>
            <Vazio
              icone={Clock}
              titulo="Nenhuma proposta parada"
              texto="Aqui aparecem as propostas que estão há mais tempo sem andamento no mesmo estágio."
            />
          </section>
          <section className="rounded-xl border border-linha bg-white">
            <header className="border-b border-linha px-5 py-4">
              <h2 className="text-base font-semibold text-marinho">Últimas propostas</h2>
            </header>
            <Vazio icone={FileText} titulo="Sem propostas ainda" texto="As propostas mais recentes da sua carteira vão aparecer aqui." />
          </section>
        </div>
      </div>
    </div>
  );
}
