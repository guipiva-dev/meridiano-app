import {
  BriefcaseBusiness,
  CalendarDays,
  ChartColumn,
  type LucideIcon,
  Plane,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

export interface ItemSidebar {
  label: string;
  icon: LucideIcon;
  path: string;
  section: "Operação" | "Administração";
  permission: string | string[];
}

export const itensSidebar: ItemSidebar[] = [
  {
    label: "Viagens",
    icon: Plane,
    path: "/viagens",
    section: "Operação",
    permission: ["viagem.ver", "viagem.ver_proprias"],
  },
  {
    label: "Clientes",
    icon: Users,
    path: "/clientes",
    section: "Operação",
    permission: ["cliente.ver", "cliente.ver_proprios"],
  },
  {
    label: "Fornecedores",
    icon: BriefcaseBusiness,
    path: "/fornecedores",
    section: "Operação",
    permission: "viagem.ver",
  },
  {
    label: "Financeiro",
    icon: Wallet,
    path: "/financeiro",
    section: "Operação",
    // C7: o Contador só tem `financeiro.ver_dre` e precisa enxergar o módulo em leitura.
    permission: ["financeiro.movimentar", "financeiro.conciliar", "financeiro.ver_dre"],
  },
  {
    label: "Agenda",
    icon: CalendarDays,
    path: "/agenda",
    section: "Operação",
    permission: ["viagem.ver", "viagem.ver_proprias"],
  },
  { label: "Relatórios", icon: ChartColumn, path: "/relatorios", section: "Operação", permission: "relatorio.ver" },
  { label: "Equipe", icon: UsersRound, path: "/equipe", section: "Administração", permission: "usuario.gerenciar" },
  { label: "Auditoria", icon: ShieldCheck, path: "/auditoria", section: "Administração", permission: "auditoria.ver" },
];

export const subnavs: Record<string, { label: string; path: string }[]> = {
  "/financeiro": [
    { label: "Conciliação", path: "/financeiro" },
    { label: "Repasses", path: "/financeiro/repasses" },
    { label: "Despesas", path: "/financeiro/despesas" },
    { label: "Fechamento", path: "/financeiro/fechamento" },
  ],
  "/viagens": [
    { label: "Viagens", path: "/viagens" },
    { label: "Nova viagem", path: "/viagens/nova" },
  ],
  "/clientes": [
    { label: "Pessoas", path: "/clientes" },
    { label: "Grupos", path: "/clientes/grupos" },
  ],
};

export function temPermissao(pode: (p: string) => boolean, permission: string | string[]) {
  return Array.isArray(permission) ? permission.some(pode) : pode(permission);
}
