import { Campo, classeCampo } from "@/components/ui";

type Valores = {
  valor?: number | null;
  possibilidade?: number | null;
  data_fechamento?: string | null;
  cond_pagamento?: string | null;
  observacao?: string | null;
  tipo_tabela?: "rad" | "aditivo" | null;
  dmp?: number | null;
  com_cce?: boolean;
};

export function CamposProposta({ valores = {} }: { valores?: Valores }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo rotulo="Valor da proposta (R$)">
        <input name="valor" type="number" step="0.01" min="0" required defaultValue={valores.valor ?? ""} className={`${classeCampo} num`} />
      </Campo>
      <Campo rotulo="Possibilidade de fechamento (%)">
        <input name="possibilidade" type="number" step="1" min="0" max="100" defaultValue={valores.possibilidade ?? ""} className={`${classeCampo} num`} />
      </Campo>
      <Campo rotulo="Tabela de preços">
        <select name="tipo_tabela" defaultValue={valores.tipo_tabela ?? ""} className={classeCampo}>
          <option value="">Não informada</option>
          <option value="rad">RAD</option>
          <option value="aditivo">Aditivos</option>
        </select>
      </Campo>
      <Campo rotulo="DMP — desconto médio ponderado (%)" ajuda="Por enquanto informado à mão; virá dos itens da proposta.">
        <input
          name="dmp" type="number" step="0.01" min="0" max="100"
          defaultValue={valores.dmp != null ? Math.round(Number(valores.dmp) * 10000) / 100 : ""}
          className={`${classeCampo} num`}
        />
      </Campo>
      <Campo rotulo="Previsão de fechamento">
        <input name="data_fechamento" type="date" defaultValue={valores.data_fechamento ?? ""} className={classeCampo} />
      </Campo>
      <Campo rotulo="Condição de pagamento">
        <input name="cond_pagamento" defaultValue={valores.cond_pagamento ?? ""} placeholder="Ex.: 1X - 28 DDL" className={classeCampo} />
      </Campo>
      <label className="flex items-center gap-2.5 text-[15px] text-tinta sm:col-span-2">
        <input name="com_cce" type="checkbox" defaultChecked={!!valores.com_cce} className="size-4 accent-[#2d6bc4]" />
        Com comissão complementar Eltech (CCE)
      </label>
      <Campo rotulo="Observação" className="sm:col-span-2">
        <textarea name="observacao" rows={3} defaultValue={valores.observacao ?? ""} className={`${classeCampo} h-auto py-2`} />
      </Campo>
    </div>
  );
}
