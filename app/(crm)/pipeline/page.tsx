import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AvisoEtapa } from "@/components/AvisoEtapa";
import { ESTAGIOS } from "@/lib/dominio";

export const metadata: Metadata = { title: "Pipeline de vendas" };

export default function Pipeline() {
  return (
    <div className="flex h-full flex-col">
      <AvisoEtapa>
        As cerca de 4.200 propostas da planilha serão distribuídas nestas colunas. Cada cartão vai mostrar há
        quantos dias a proposta está sem andamento.
      </AvisoEtapa>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-linha bg-white p-1">
          {["Quadro", "Lista"].map((t, i) => (
            <button
              key={t}
              className={`h-8 rounded-md px-4 text-sm font-medium ${i === 0 ? "bg-ceu text-marinho" : "text-apagado hover:text-marinho"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-azul px-4 text-sm font-semibold text-white hover:bg-azul-escuro">
          <Plus className="size-4" /> Nova proposta
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-h-[420px] gap-4">
          {ESTAGIOS.map((e) => (
            <section key={e.id} className="flex w-[272px] shrink-0 flex-col rounded-xl bg-[#edf3fa]">
              <header className="px-3.5 pb-2 pt-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: e.cor }} />
                  <h2 className="flex-1 truncate text-[15px] font-semibold text-marinho">{e.nome}</h2>
                  <span className="num rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-apagado">0</span>
                </div>
                <p className="num mt-1 pl-[18px] text-[13px] text-apagado">R$ 0,00</p>
              </header>
              <div className="mx-2 mb-2 flex flex-1 items-start justify-center rounded-lg border border-dashed border-linha px-3 py-8">
                <p className="text-center text-[13px] text-apagado/80">Nenhuma proposta neste estágio</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
