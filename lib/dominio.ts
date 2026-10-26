/** Estágios das propostas, na ordem do funil (conforme a planilha DADOS_GERAIS_CRM). */
export const ESTAGIOS = [
  { id: "criacao", nome: "Criação proposta", cor: "#8FB3E3" },
  { id: "checagem", nome: "Checagem", cor: "#5B9BE0" },
  { id: "validado", nome: "Validado", cor: "#2D6BC4" },
  { id: "enviado", nome: "Enviado", cor: "#203167" },
  { id: "amostra_enviada", nome: "Amostra enviada", cor: "#3FA9E0" },
  { id: "amostra_aprovada", nome: "Amostra aprovada", cor: "#1F9D8A" },
  { id: "rejeitado_cliente", nome: "Rejeitado pelo cliente", cor: "#C9824A" },
  { id: "reprovado", nome: "Reprovado", cor: "#B4545A" },
] as const;

export type EstagioId = (typeof ESTAGIOS)[number]["id"];
export const ESTAGIOS_ABERTOS: EstagioId[] = ["criacao", "checagem", "validado", "enviado", "amostra_enviada", "amostra_aprovada"];
export const nomeEstagio = (id: string) => ESTAGIOS.find((e) => e.id === id)?.nome ?? id;
export const corEstagio = (id: string) => ESTAGIOS.find((e) => e.id === id)?.cor ?? "#8FB3E3";

export const TIPOS_VENDEDOR = [
  { id: "representante", nome: "Representante" },
  { id: "vendedor_interno", nome: "Vendedor interno" },
  { id: "retaguarda", nome: "Retaguarda" },
] as const;
export const nomeTipoVendedor = (id: string | null) => TIPOS_VENDEDOR.find((t) => t.id === id)?.nome ?? "—";

export type PerfilId =
  | "diretoria"
  | "admin"
  | "coordenacao"
  | "conferente"
  | "financeiro"
  | "operacional"
  | "producao";

export const PERFIS: { id: PerfilId; nome: string; resumo: string; fase?: string }[] = [
  {
    id: "diretoria",
    nome: "Diretoria",
    resumo:
      "Acesso irrestrito: todos os dados comerciais, andamento das propostas, tabela de preços e regras de comissão.",
  },
  {
    id: "admin",
    nome: "Admin",
    resumo:
      "Mesmas permissões da Diretoria nesta fase. Pode alterar regras de comissão, mas não excluir parâmetros.",
  },
  {
    id: "coordenacao",
    nome: "Coordenação",
    resumo:
      "Visão comercial completa. Clientes e regras de comissão só para consulta; edita propostas da equipe.",
  },
  {
    id: "conferente",
    nome: "Operacional conferente",
    resumo:
      "Vê a fila de propostas para checagem e a carteira geral; pode criar propostas em nome de outros usuários.",
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    resumo:
      "Acesso parecido com a Coordenação, incluindo dados de clientes e condições de faturamento.",
  },
  {
    id: "operacional",
    nome: "Operacional",
    resumo: "Vê apenas o próprio dashboard e a própria carteira de clientes.",
  },
  {
    id: "producao",
    nome: "Produção operacional",
    resumo: "Registro da produção de itens sem estoque, antes do pedido de venda.",
    fase: "Fase futura",
  },
];

export const nomePerfil = (id: string | null | undefined) => PERFIS.find((p) => p.id === id)?.nome ?? "Sem perfil";
