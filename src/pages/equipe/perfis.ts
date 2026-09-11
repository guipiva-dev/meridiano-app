export const PERFIS = ["dono", "financeiro", "agente", "vendedor_externo", "contador"] as const;
export type PerfilChave = (typeof PERFIS)[number];

const ROTULOS: Record<PerfilChave, string> = {
  dono: "Dono",
  financeiro: "Financeiro",
  agente: "Agente",
  vendedor_externo: "Vendedor externo",
  contador: "Contador",
};

export const ROTULO_PERFIL: Record<string, string> = ROTULOS;

export const OPCOES_PERFIL = PERFIS.map((p) => ({ value: p, label: ROTULOS[p] }));
