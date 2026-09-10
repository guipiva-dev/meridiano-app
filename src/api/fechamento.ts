import type { ConciliacaoItemDto } from "./financeiro";
import { api } from "./http";

export type StatusPeriodo = "aberto" | "pendencias" | "fechado";

export interface PeriodoDto {
  competencia: string;
  status: StatusPeriodo;
  reservas: number;
  comissoesPendentes: number;
  comissoesPendentesValor: number;
  despesas: number;
  receitaPrevista: number;
  receitaRecebida: number;
  fechadoEm: string | null;
  fechadoPorNome: string | null;
  corrente: boolean;
}

export const fechamentoApi = {
  periodos: (ano: number) => api.get<PeriodoDto[]>(`/periodos?ano=${ano}`),
  pendentes: (competencia: string) => api.get<ConciliacaoItemDto[]>(`/periodos/${competencia}/pendentes`),
  fechar: (competencia: string) => api.post<PeriodoDto>(`/periodos/${competencia}/fechar`),
  reabrir: (competencia: string, motivo: string) =>
    api.post<PeriodoDto>(`/periodos/${competencia}/reabrir`, undefined, { motivo }),
};

export const chavesFechamento = {
  periodos: (ano: number) => ["periodos", ano] as const,
  pendentes: (c: string) => ["periodos", c, "pendentes"] as const,
};
