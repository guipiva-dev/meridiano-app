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
import type { BadgesDto } from "@/api/agenda";

export interface ItemSidebar {
  label: string;
  icon: LucideIcon;
  path: string;
  section: "Operação" | "Administração";
  permission: string | string[];
  /** R4: chave de `BadgesDto` cujo valor vira badge amarelo ao lado do label. */
  badge?: keyof BadgesDto;
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
    badge: "clientes",
  },
  {
    label: "Fornecedores",
    icon: BriefcaseBusiness,
    path: "/fornecedores",
    section: "Operação",
    // P01: mesma permissão que protege a rota — o vendedor externo (só `viagem.ver_proprias`) não vê o item.
    permission: "fornecedor.ver",
  },
  {
    label: "Financeiro",
    icon: Wallet,
    path: "/financeiro",
    section: "Operação",
    // C7: o Contador só tem `financeiro.ver_dre` e precisa enxergar o módulo em leitura.
    permission: ["financeiro.movimentar", "financeiro.conciliar", "financeiro.ver_dre"],
    badge: "financeiro",
  },
  {
    label: "Agenda",
    icon: CalendarDays,
    path: "/agenda",
    section: "Operação",
    permission: ["viagem.ver", "viagem.ver_proprias"],
    badge: "agenda",
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
  // MED-04: "Nova viagem" saiu do subnav — o botão do header da lista já cobre.
  "/viagens": [{ label: "Viagens", path: "/viagens" }],
  "/clientes": [
    { label: "Pessoas", path: "/clientes" },
    { label: "Grupos", path: "/clientes/grupos" },
  ],
};

export function temPermissao(pode: (p: string) => boolean, permission: string | string[]) {
  return Array.isArray(permission) ? permission.some(pode) : pode(permission);
}
