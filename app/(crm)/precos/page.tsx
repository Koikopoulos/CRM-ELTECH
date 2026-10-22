import type { Metadata } from "next";
import { Plus, Tags } from "lucide-react";
import { AvisoEtapa } from "@/components/AvisoEtapa";
import { CabecalhoTabela } from "@/components/Tabela";
import { Vazio } from "@/components/Vazio";

export const metadata: Metadata = { title: "Tabela de preços" };

const COLUNAS = [
  { nome: "Produto" },
  { nome: "Código TOTVS" },
  { nome: "Embalagem" },
  { nome: "Preço de venda", direita: true },
  { nome: "IPI", direita: true },
  { nome: "Tabela" },
];

export default function Precos() {
  return (
    <div className="mx-auto max-w-7xl">
      <AvisoEtapa>
        Os produtos das tabelas RAD e Aditivos entram na importação. Diretoria e Admin poderão incluir, editar e
        excluir; os demais perfis apenas consultam.
      </AvisoEtapa>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-linha bg-white p-1">
          {["Todas", "RAD", "Aditivos"].map((t, i) => (
            <button
              key={t}
              className={`h-8 rounded-md px-4 text-sm font-medium ${i === 0 ? "bg-ceu text-marinho" : "text-apagado hover:text-marinho"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-azul px-4 text-sm font-semibold text-white hover:bg-azul-escuro">
          <Plus className="size-4" /> Novo produto
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-linha bg-white">
        <table className="w-full min-w-[760px] text-[15px]">
          <CabecalhoTabela colunas={COLUNAS} />
        </table>
        <Vazio icone={Tags} titulo="Tabela de preços vazia" texto="Os preços, IPI e alíquotas de ICMS de cada produto vão aparecer aqui." />
      </div>
    </div>
  );
}
