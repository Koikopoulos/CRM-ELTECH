import { Campo, classeCampo } from "@/components/ui";

export type Cliente = {
  id?: number; tipo_pessoa?: string | null; razao_social?: string | null; nome_fantasia?: string | null; cnpj?: string | null;
  cpf?: string | null; contato?: string | null; segmento_id?: number | null; segmento_original?: string | null;
  cidade?: string | null; uf?: string | null; status?: string | null; origem?: string | null; representante_id?: string | null;
  telefone?: string | null; email?: string | null; inscricao_estadual?: string | null; email_faturamento?: string | null;
  endereco_faturamento?: string | null; cond_pagamento_padrao?: string | null; obs_faturamento?: string | null;
};

/**
 * Campos do cadastro de cliente.
 * - geraisBloqueados: Financeiro (só faturamento), Coordenação e Conferente (só consulta).
 * - faturamentoBloqueado: perfis que só consultam.
 */
export function CamposCliente({
  c = {}, geraisBloqueados = false, faturamentoBloqueado = false, vendedores, escolherVendedor,
  segmentos,
}: {
  c?: Cliente; geraisBloqueados?: boolean; faturamentoBloqueado?: boolean;
  vendedores: { id: string; nome: string }[]; escolherVendedor: boolean; segmentos: { id: number; nome: string }[];
}) {
  const g = geraisBloqueados;
  const t = (name: keyof Cliente, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, bloq = g) => (
    <Campo rotulo={rotulo}>
      <input name={name} defaultValue={(c[name] as string | null) ?? ""} disabled={bloq} className={classeCampo} {...extra} />
    </Campo>
  );
  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[15px] font-semibold text-marinho">Dados do cliente</legend>
        <Campo rotulo="Tipo de pessoa">
          <select name="tipo_pessoa" defaultValue={c.tipo_pessoa ?? "juridica"} disabled={g} className={classeCampo}>
            <option value="juridica">Pessoa jurídica</option>
            <option value="fisica">Pessoa física</option>
          </select>
        </Campo>
        {t("razao_social", "Razão social ou nome", { required: !g })}
        {t("nome_fantasia", "Nome fantasia")}
        {t("contato", "Pessoa de contato")}
        {t("cnpj", "CNPJ", { placeholder: "00.000.000/0000-00", inputMode: "numeric" })}
        {t("cpf", "CPF", { placeholder: "000.000.000-00", inputMode: "numeric" })}
        {t("telefone", "Telefone", { inputMode: "tel" })}
        {t("email", "E-mail", { type: "email" })}
        {t("cidade", "Cidade")}
        {t("uf", "UF", { maxLength: 2 })}
        <Campo rotulo="Segmento">
          <select name="segmento_id" defaultValue={c.segmento_id ?? ""} disabled={g} className={classeCampo}>
            <option value="">{c.segmento_original && !c.segmento_id ? `Não classificado (${c.segmento_original})` : "Não classificado"}</option>
            {segmentos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </Campo>
        <input type="hidden" name="segmento_original" value={c.segmento_original ?? ""} />
        {t("status", "Status")}
        {t("origem", "Origem")}
        <Campo rotulo="Vendedor responsável">
          {escolherVendedor ? (
            <select name="representante_id" defaultValue={c.representante_id ?? ""} disabled={g} required={!g} className={classeCampo}>
              <option value="" disabled>Escolha o vendedor</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          ) : (
            <input disabled value={vendedores.find((v) => v.id === c.representante_id)?.nome ?? "Você"} className={classeCampo} />
          )}
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[15px] font-semibold text-marinho">Faturamento</legend>
        {t("inscricao_estadual", "Inscrição estadual", {}, faturamentoBloqueado)}
        {t("email_faturamento", "E-mail para nota fiscal", { type: "email" }, faturamentoBloqueado)}
        {t("cond_pagamento_padrao", "Condição de pagamento padrão", {}, faturamentoBloqueado)}
        {t("endereco_faturamento", "Endereço de faturamento", {}, faturamentoBloqueado)}
        <Campo rotulo="Observações de faturamento" className="sm:col-span-2">
          <textarea name="obs_faturamento" rows={2} defaultValue={c.obs_faturamento ?? ""} disabled={faturamentoBloqueado} className={`${classeCampo} h-auto py-2`} />
        </Campo>
      </fieldset>
    </div>
  );
}
