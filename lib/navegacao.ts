export type ItemMenu = { href: string; rotulo: string; icone: string };
export type GrupoMenu = { titulo: string; itens: ItemMenu[] };

export const MENU: GrupoMenu[] = [
  {
    titulo: "Visão geral",
    itens: [{ href: "/dashboard", rotulo: "Dashboard", icone: "gauge" }],
  },
  {
    titulo: "Relacionamento",
    itens: [{ href: "/contatos", rotulo: "Contatos", icone: "users" }],
  },
  {
    titulo: "Vendas",
    itens: [
      { href: "/pipeline", rotulo: "Pipeline de vendas", icone: "kanban" },
      { href: "/precos", rotulo: "Tabela de preços", icone: "tags" },
    ],
  },
  {
    titulo: "Sistema",
    itens: [{ href: "/configuracoes", rotulo: "Configurações", icone: "settings" }],
  },
];

export function tituloDaRota(path: string): string {
  for (const g of MENU) for (const i of g.itens) if (path.startsWith(i.href)) return i.rotulo;
  return "CRM Eltech";
}
