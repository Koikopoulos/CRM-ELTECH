import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";
import { AvisoEtapa } from "@/components/AvisoEtapa";
import { CabecalhoTabela } from "@/components/Tabela";
import { Vazio } from "@/components/Vazio";

export const metadata: Metadata = { title: "Contatos" };

const COLUNAS = [
  { nome: "Empresa" },
  { nome: "CNPJ / CPF" },
  { nome: "Segmento" },
  { nome: "Cidade / UF" },
  { nome: "Representante" },
  { nome: "Status" },
  { nome: "Propostas", direita: true },
];

export default function Contatos() {
  return (
    <div className="mx-auto max-w-7xl">
      <AvisoEtapa>A carteira com cerca de 6 mil clientes será carregada na importação da planilha.</AvisoEtapa>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {["Todos", "Pessoa jurídica", "Pessoa física", "Sem representante"].map((f, i) => (
            <button
              key={f}
              className={`h-9 rounded-full border px-4 text-sm font-medium ${
                i === 0 ? "border-azul bg-azul text-white" : "border-linha bg-white text-tinta/80 hover:border-azul/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-azul px-4 text-sm font-semibold text-white hover:bg-azul-escuro">
          <Plus className="size-4" /> Novo cliente
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-linha bg-white">
        <table className="w-full min-w-[860px] text-[15px]">
          <CabecalhoTabela colunas={COLUNAS} />
        </table>
        <Vazio icone={Users} titulo="Nenhum cliente cadastrado" texto="Depois da importação, você poderá buscar por nome, CNPJ, cidade ou representante." />
      </div>
    </div>
  );
}
