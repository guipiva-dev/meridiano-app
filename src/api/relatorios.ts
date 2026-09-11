import { qsFiltro } from "./financeiro";
import { api } from "./http";

export interface KpisRelatorioDto {
  vendaAno: number;
  reservas: number;
  viagens: number;
  receitaRecebida: number;
  receitaPrevista: number;
  recebidoDeAnosAnteriores: number;
  despesasPagas: number;
  despesasFixas: number;
  despesasViagens: number;
  resultadoOperacional: number;
  margemOperacionalPct: number | null;
  margemComercialPct: number | null;
}

export interface TetoMeiDto {
  receitaAno: number;
  teto: number;
  percentualTeto: number;
  alerta: boolean;
}

export interface ReceitaMesDto {
  mes: number;
  prevista: number;
  recebida: number;
}

export interface TipoViagemDto {
  tipo: "nacional" | "internacional";
  venda: number;
  pct: number;
  margemPct: number | null;
}

export interface FornecedorRankingDto {
  fornecedorId: string;
  nome: string;
  reservas: number;
  volume: number;
  receita: number;
  margemPct: number | null;
}

export interface ServicoVendidoDto {
  tipo: string;
  reservas: number;
}

export interface ResponsavelDto {
  id: string;
  nome: string;
}

export interface RelatorioResumoDto {
  ano: number;
  anos: number[];
  vendedorId: string | null;
  ate: string;
  kpis: KpisRelatorioDto;
  tetoMei: TetoMeiDto | null;
  receitaPorMes: ReceitaMesDto[];
  nacionalInternacional: TipoViagemDto[];
  fornecedores: FornecedorRankingDto[];
  servicos: ServicoVendidoDto[];
  vendedores: ResponsavelDto[];
}

export function qsRelatorios(ano: number | null, vendedorId: string | null): string {
  return qsFiltro({ ano: ano ?? undefined, vendedorId: vendedorId ?? undefined });
}

export const relatoriosApi = {
  resumo: (ano: number | null, vendedorId: string | null) =>
    api.get<RelatorioResumoDto>(`/relatorios/resumo?${qsRelatorios(ano, vendedorId)}`),
};

export function urlCsv(ano: number | null, vendedorId: string | null): string {
  return `/api/v1/relatorios/csv?${qsRelatorios(ano, vendedorId)}`;
}

export const chavesRelatorios = {
  resumo: (ano: number | null, vendedorId: string | null) => ["relatorios", "resumo", ano, vendedorId] as const,
};
