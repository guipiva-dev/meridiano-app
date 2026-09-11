import { api } from "./http";

export type TipoMovimento =
  | "recebimento_operadora"
  | "recebimento_cliente"
  | "pagamento_fornecedor"
  | "estorno_operadora"
  | "reembolso_cliente";
export type FormaPagamentoFin = "pix" | "boleto" | "cartao" | "transferencia" | "dinheiro";

/** Tipos que entram dinheiro; os demais são saída e o banco grava com sinal negativo. */
export const TIPOS_ENTRADA: TipoMovimento[] = ["recebimento_operadora", "recebimento_cliente"];
export const TIPOS_MOVIMENTO: TipoMovimento[] = [
  "recebimento_operadora",
  "recebimento_cliente",
  "pagamento_fornecedor",
  "estorno_operadora",
  "reembolso_cliente",
];
export const FORMAS_PAGAMENTO: FormaPagamentoFin[] = ["pix", "boleto", "cartao", "transferencia", "dinheiro"];

export interface MovimentoRequest {
  reservaId: string;
  tipo: TipoMovimento;
  valor: number;
  dataMovimento: string;
  formaPagamento: FormaPagamentoFin | null;
  observacao: string | null;
  versao?: string;
}

export interface MovimentoDto {
  id: string;
  versao: string;
  reservaId: string;
  viagemId: string;
  codigoViagem: string;
  localizador: string | null;
  fornecedorNome: string;
  tipo: TipoMovimento;
  valor: number;
  dataMovimento: string;
  formaPagamento: FormaPagamentoFin | null;
  observacao: string | null;
  criadoPorNome: string | null;
  criadoEm: string;
}

export interface ConciliacaoItemDto {
  reservaId: string;
  viagemId: string;
  codigo: string;
  titular: string | null;
  destino: string;
  localizador: string | null;
  fornecedorId: string;
  fornecedorNome: string;
  dataCompra: string;
  dataPrevistaComissao: string | null;
  situacaoComissao: string;
  diasAtraso: number | null;
  esperado: number;
  recebido: number;
  saldo: number;
  conciliacaoEncerrada: boolean;
  divergenciaMotivo: string | null;
  ultimoRecebimentoEm: string | null;
  elegivelLote: boolean;
}

export interface KpiValorDto {
  valor: number;
  reservas: number;
  /** operadoras (aReceber) · piorDias (atrasadas) · null (vencemSemana). */
  extra: number | null;
}
export interface KpisConciliacaoDto {
  aReceber: KpiValorDto;
  atrasadas: KpiValorDto;
  vencemSemana: KpiValorDto;
  recebidoMes: { valor: number; variacaoPercentual: number | null };
}
export interface ContadoresConciliacaoDto {
  pendentes: number;
  atrasadas: number;
  recebidasMes: number;
  divergencias: number;
}
export interface ConciliacaoDto {
  itens: ConciliacaoItemDto[];
  total: number;
  pagina: number;
  tamanho: number;
  mes: string;
  contadores: ContadoresConciliacaoDto;
  kpis: KpisConciliacaoDto;
}

export type AbaConciliacao = "pendentes" | "atrasadas" | "recebidas" | "divergencias";
export interface FiltroConciliacao {
  aba?: AbaConciliacao;
  fornecedorId?: string;
  previsto?: "ate_hoje" | "semana" | "qualquer";
  mes?: string;
  pagina?: number;
  tamanho?: number;
}

/** Query string de filtro: omite undefined/null/"" e booleano falso (o back já assume o default). */
export function qsFiltro(f: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === "" || v === false) continue;
    p.append(k, String(v));
  }
  return p.toString();
}

export function qsConciliacao(f: FiltroConciliacao): string {
  return qsFiltro({ ...f });
}

export const financeiroApi = {
  conciliacao: (f: FiltroConciliacao) => api.get<ConciliacaoDto>(`/conciliacao?${qsConciliacao(f)}`),
  movimentosDaViagem: (viagemId: string) => api.get<MovimentoDto[]>(`/viagens/${viagemId}/movimentos`),
  lancar: (m: MovimentoRequest, motivo?: string) => api.post<MovimentoDto>("/movimentos", m, { motivo }),
  corrigir: (id: string, m: MovimentoRequest, motivo?: string) =>
    api.put<MovimentoDto>(`/movimentos/${id}`, m, { motivo }),
  excluir: (id: string, motivo: string) => api.delete(`/movimentos/${id}`, { motivo }),
  encerrarDivergencia: (reservaId: string, motivo: string) =>
    api.post<ConciliacaoItemDto>(`/reservas/${reservaId}/encerrar-divergencia`, { motivo }),
  receberLote: (
    reservaIds: string[],
    dataMovimento: string,
    formaPagamento: FormaPagamentoFin | null,
    motivo?: string,
  ) =>
    api.post<{ movimentos: MovimentoDto[] }>(
      "/reservas/receber-lote",
      { reservaIds, dataMovimento, formaPagamento },
      { motivo },
    ),
};

export const chavesFinanceiro = {
  conciliacao: (f: FiltroConciliacao) => ["conciliacao", f] as const,
  movimentosDaViagem: (id: string) => ["viagens", id, "movimentos"] as const,
};
