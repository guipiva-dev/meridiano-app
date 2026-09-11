import type { FormaPagamentoFin } from "./financeiro";
import { qsFiltro } from "./financeiro";
import { api } from "./http";

export type CategoriaDespesa = "fixo" | "imposto" | "operacional" | "marketing" | "outro";
export type SituacaoDespesa = "a_pagar" | "vencida" | "paga";

export const CATEGORIAS_DESPESA: CategoriaDespesa[] = ["fixo", "imposto", "operacional", "marketing", "outro"];

export interface DespesaRequest {
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  vencimento: string;
  pago: boolean;
  pagoEm: string | null;
  formaPagamento: FormaPagamentoFin | null;
  recorrente: boolean;
  recorrenciaAte: string | null;
  viagemId: string | null;
  fornecedorId: string | null;
  observacao: string | null;
  versao?: string;
}

export interface DespesaDto {
  id: string;
  versao: string;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  vencimento: string;
  pago: boolean;
  pagoEm: string | null;
  formaPagamento: FormaPagamentoFin | null;
  recorrente: boolean;
  recorrenciaAte: string | null;
  recorrenciaOrigemId: string | null;
  viagemId: string | null;
  codigoViagem: string | null;
  tituloViagem: string | null;
  fornecedorId: string | null;
  fornecedorNome: string | null;
  observacao: string | null;
  situacao: SituacaoDespesa;
}

/** `proxima` é a ocorrência gerada quando a despesa é recorrente e foi paga/criada. */
export interface DespesaCriadaDto {
  despesa: DespesaDto;
  proxima: DespesaDto | null;
}

export interface KpisDespesasDto {
  lancadoValor: number;
  lancadoQtd: number;
  aPagarValor: number;
  vencidas: number;
  vencemAte7Dias: number;
  fixosValor: number;
  ligadasViagemValor: number;
  ligadasViagemQtd: number;
}

export interface DespesasDto {
  itens: DespesaDto[];
  total: number;
  pagina: number;
  tamanho: number;
  mes: string | null;
  kpis: KpisDespesasDto;
}

export interface FiltroDespesas {
  mes?: string;
  categoria?: CategoriaDespesa;
  situacao?: SituacaoDespesa;
  viagemId?: string;
  soVinculadas?: boolean;
  pagina?: number;
  tamanho?: number;
}

export function qsDespesas(f: FiltroDespesas): string {
  return qsFiltro({ ...f });
}

export const despesasApi = {
  listar: (f: FiltroDespesas) => api.get<DespesasDto>(`/despesas?${qsDespesas(f)}`),
  criar: (d: DespesaRequest, motivo?: string) => api.post<DespesaCriadaDto>("/despesas", d, { motivo }),
  atualizar: (id: string, d: DespesaRequest, motivo?: string) => api.put<DespesaDto>(`/despesas/${id}`, d, { motivo }),
  excluir: (id: string, motivo?: string) => api.delete(`/despesas/${id}`, { motivo }),
  pagar: (id: string, pagoEm: string, formaPagamento: FormaPagamentoFin, versao: string, motivo?: string) =>
    api.post<DespesaCriadaDto>(`/despesas/${id}/pagar`, { pagoEm, formaPagamento, versao }, { motivo }),
};

export const chavesDespesas = {
  lista: (f: FiltroDespesas) => ["despesas", f] as const,
  daViagem: (viagemId: string) => ["despesas", { viagemId }] as const,
};
