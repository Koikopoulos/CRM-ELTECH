import Link from "next/link";
import type { ComponentProps } from "react";

export const classeBotao = {
  primario:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-azul px-4 text-sm font-semibold text-white transition-colors hover:bg-azul-escuro disabled:opacity-60",
  secundario:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-linha bg-white px-4 text-sm font-medium text-marinho transition-colors hover:border-azul/40 hover:bg-nevoa disabled:opacity-60",
  perigo:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e7c4c6] bg-white px-4 text-sm font-medium text-[#9a3a40] hover:bg-[#fbeeee] disabled:opacity-60",
};

const campoBase =
  "h-10 rounded-lg border border-linha bg-white px-3 text-[15px] outline-none transition-colors placeholder:text-apagado/60 focus:border-azul focus:ring-3 focus:ring-azul/15 disabled:bg-nevoa disabled:text-apagado";
export const classeCampo = `${campoBase} w-full`;
/** Campo com largura do conteúdo, para filtros em linha. */
export const classeFiltro = `${campoBase} w-auto`;

export function Cartao({ titulo, acao, children, className = "" }: { titulo?: string; acao?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-linha bg-white ${className}`}>
      {titulo && (
        <header className="flex items-center justify-between gap-3 border-b border-linha px-5 py-3.5">
          <h2 className="text-base font-semibold text-marinho">{titulo}</h2>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function Campo({ rotulo, ajuda, children, className = "" }: { rotulo: string; ajuda?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-tinta">{rotulo}</span>
      {children}
      {ajuda && <span className="mt-1 block text-[13px] text-apagado">{ajuda}</span>}
    </label>
  );
}

export function Selo({ cor, children }: { cor?: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-nevoa px-2.5 py-0.5 text-[13px] font-medium text-marinho">
      {cor && <span className="size-2 rounded-full" style={{ background: cor }} />}
      {children}
    </span>
  );
}

/** Dias parados no estágio: verde até 2, âmbar de 3 a 7, vermelho acima de 7. */
export function SeloDias({ dias, aberto = true }: { dias: number; aberto?: boolean }) {
  const cls = !aberto
    ? "bg-nevoa text-apagado"
    : dias > 7
      ? "bg-[#fbeeee] text-[#9a3a40]"
      : dias >= 3
        ? "bg-[#fdf3e3] text-[#8a5a12]"
        : "bg-[#e8f6f1] text-[#1d6b57]";
  return (
    <span className={`num whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`} title="Dias neste estágio">
      {dias === 0 ? "hoje" : dias === 1 ? "1 dia" : `${dias} dias`}
    </span>
  );
}

export function Mensagem({ tipo, children }: { tipo: "erro" | "ok"; children: React.ReactNode }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-lg px-3.5 py-2.5 text-sm ${tipo === "erro" ? "bg-[#fbeeee] text-[#9a3a40]" : "bg-[#e8f6f1] text-[#1d6b57]"}`}
    >
      {children}
    </p>
  );
}

export function LinkPagina(props: ComponentProps<typeof Link> & { ativo?: boolean; desabilitado?: boolean }) {
  const { ativo, desabilitado, className = "", ...resto } = props;
  if (desabilitado) return <span className={`${classeBotao.secundario} pointer-events-none opacity-50 ${className}`}>{props.children}</span>;
  return <Link {...resto} className={`${classeBotao.secundario} ${ativo ? "border-azul text-azul" : ""} ${className}`} />;
}

export function Paginacao({ pagina, total, porPagina, href }: { pagina: number; total: number; porPagina: number; href: (p: number) => string }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linha px-4 py-3 text-sm text-apagado">
      <span className="num">
        {total === 0 ? "Nenhum registro" : `${(pagina - 1) * porPagina + 1}–${Math.min(pagina * porPagina, total)} de ${total.toLocaleString("pt-BR")}`}
      </span>
      <div className="flex gap-2">
        <LinkPagina href={href(pagina - 1)} desabilitado={pagina <= 1}>Anterior</LinkPagina>
        <LinkPagina href={href(pagina + 1)} desabilitado={pagina >= paginas}>Próxima</LinkPagina>
      </div>
    </div>
  );
}
