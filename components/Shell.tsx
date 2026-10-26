"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Gauge,
  KanbanSquare,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { MENU, tituloDaRota } from "@/lib/navegacao";

const ICONES: Record<string, LucideIcon> = {
  gauge: Gauge,
  users: Users,
  kanban: KanbanSquare,
  tags: Tags,
  settings: Settings,
};

type Usuario = { nome: string; email: string; perfil: string };

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento: segue sem lembrar */
  }
}

export function Shell({ usuario, children }: { usuario: Usuario; children: React.ReactNode }) {
  const path = usePathname();
  const [compacto, setCompacto] = useState(false);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [fechados, setFechados] = useState<string[]>([]);

  useEffect(() => {
    setCompacto(ler("crm.menu.compacto") === "1");
    const f = ler("crm.menu.fechados");
    if (f) setFechados(f.split("|").filter(Boolean));
  }, []);

  useEffect(() => setGavetaAberta(false), [path]);

  function alternarCompacto() {
    const novo = !compacto;
    setCompacto(novo);
    gravar("crm.menu.compacto", novo ? "1" : "0");
  }

  function alternarGrupo(titulo: string) {
    const novo = fechados.includes(titulo) ? fechados.filter((t) => t !== titulo) : [...fechados, titulo];
    setFechados(novo);
    gravar("crm.menu.fechados", novo.join("|"));
  }

  const iniciais = usuario.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const menu = (modoCompacto: boolean) => (
    <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 pb-4">
      {MENU.map((grupo) => {
        const fechado = !modoCompacto && fechados.includes(grupo.titulo);
        return (
          <div key={grupo.titulo} className="mt-5 first:mt-2">
            {modoCompacto ? (
              <div className="mx-3 mb-2 h-px bg-linha first:hidden" />
            ) : (
              <button
                type="button"
                onClick={() => alternarGrupo(grupo.titulo)}
                aria-expanded={!fechado}
                className="group flex w-full items-center justify-between rounded-md px-3 py-1 text-[13px] font-medium text-apagado hover:text-marinho"
              >
                {grupo.titulo}
                <ChevronDown
                  className={`size-3.5 opacity-0 transition-transform group-hover:opacity-100 ${fechado ? "-rotate-90 opacity-100" : ""}`}
                />
              </button>
            )}
            {!fechado && (
              <ul className="mt-1 space-y-0.5">
                {grupo.itens.map((item) => {
                  const Icone = ICONES[item.icone] ?? Gauge;
                  const ativo = path.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={modoCompacto ? item.rotulo : undefined}
                        aria-current={ativo ? "page" : undefined}
                        className={`relative flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors ${
                          ativo
                            ? "bg-ceu font-semibold text-marinho"
                            : "text-tinta/80 hover:bg-nevoa hover:text-marinho"
                        } ${modoCompacto ? "justify-center px-0" : ""}`}
                      >
                        {ativo && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-azul" />}
                        <Icone className={`size-[18px] shrink-0 ${ativo ? "text-azul" : "text-apagado"}`} />
                        {!modoCompacto && <span className="truncate">{item.rotulo}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );

  const rodape = (modoCompacto: boolean) => (
    <div className="border-t border-linha p-3">
      <div className={`flex items-center gap-3 rounded-lg p-2 ${modoCompacto ? "justify-center" : ""}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ceu text-sm font-semibold text-marinho">
          {iniciais || "?"}
        </span>
        {!modoCompacto && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-tinta">{usuario.nome}</p>
            <p className="truncate text-[13px] text-apagado">{usuario.perfil}</p>
          </div>
        )}
        {!modoCompacto && (
          <form action="/auth/sair" method="post">
            <button
              type="submit"
              title="Sair"
              className="grid size-8 place-items-center rounded-md text-apagado hover:bg-nevoa hover:text-marinho"
            >
              <LogOut className="size-4" />
              <span className="sr-only">Sair</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );

  const marca = (modoCompacto: boolean) => (
    <Link href="/dashboard" className={`flex h-16 items-center gap-2.5 px-5 ${modoCompacto ? "justify-center px-0" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/eltech-icon.png" alt="" width={32} height={32} className="size-8" />
      {!modoCompacto && (
        <span className="leading-none">
          <span className="block text-[19px] font-bold tracking-[-0.01em] text-marinho">eltech</span>
          <span className="block text-[12px] font-medium text-apagado">CRM comercial</span>
        </span>
      )}
    </Link>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Menu lateral (desktop) */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-linha bg-white transition-[width] duration-200 lg:flex ${
          compacto ? "w-[76px]" : "w-[252px]"
        }`}
      >
        {marca(compacto)}
        {menu(compacto)}
        {rodape(compacto)}
      </aside>

      {/* Gaveta (celular e tablet) */}
      {gavetaAberta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-marinho/30"
            onClick={() => setGavetaAberta(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {marca(false)}
              <button
                onClick={() => setGavetaAberta(false)}
                className="grid size-9 place-items-center rounded-md text-apagado hover:bg-nevoa"
              >
                <X className="size-5" />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>
            {menu(false)}
            {rodape(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-linha bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setGavetaAberta(true)}
            className="grid size-9 place-items-center rounded-md text-apagado hover:bg-nevoa lg:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">Abrir menu</span>
          </button>
          <button
            onClick={alternarCompacto}
            title={compacto ? "Expandir menu" : "Recolher menu"}
            className="hidden size-9 place-items-center rounded-md text-apagado hover:bg-nevoa hover:text-marinho lg:grid"
          >
            {compacto ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            <span className="sr-only">{compacto ? "Expandir menu" : "Recolher menu"}</span>
          </button>
          <h1 className="truncate text-lg font-semibold text-marinho">{tituloDaRota(path)}</h1>
          <form action="/contatos" role="search" className="ml-auto hidden w-full max-w-xs items-center gap-2 rounded-lg border border-linha bg-nevoa px-3 md:flex">
            <Search className="size-4 text-apagado" />
            <input
              type="search"
              name="q"
              aria-label="Buscar cliente"
              placeholder="Buscar cliente, CNPJ ou cidade"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-apagado/70"
            />
          </form>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
