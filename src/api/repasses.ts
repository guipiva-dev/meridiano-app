import { api } from "./http";

export type StatusRepasse = "bloqueado" | "a_pagar" | "pago";

export interface RepasseItemDto {
  id: string;
  versao: string;
  viagemId: string;
  codigo: string;
  titular: string | null;
  destino: string;
  usuarioId: string;
  valor: number | null;
  status: StatusRepasse;
  liberadoEm: string | null;
  pagoEm: string | null;
  observacao: string | null;
  /** Reservas ainda sem comissão recebida que seguram a liberação. */
  aguardando: number;
  ultimoRecebimentoEm: string | null;
}

export interface VendedorRepassesDto {
  usuarioId: string;
  nome: string;
  viagensAno: number;
  aPagarValor: number;
  aPagarViagens: number;
  itens: RepasseItemDto[];
}

export interface KpisRepassesDto {
  aPagarValor: number;
  aPagarVendedores: number;
  aPagarViagens: number;
  bloqueadoValor: number;
  bloqueadoViagens: number;
  semValor: number;
}

export interface RepassesDto {
  kpis: KpisRepassesDto;
  vendedores: VendedorRepassesDto[];
  pagos: string | null;
  ano: number;
}

export const repassesApi = {
  listar: (pagos?: string) => api.get<RepassesDto>(`/repasses${pagos ? `?pagos=${pagos}` : ""}`),
  definirValor: (id: string, valor: number | null, versao: string) =>
    api.put<RepasseItemDto>(`/repasses/${id}/valor`, { valor, versao }),
  pagarLote: (repasseIds: string[], pagoEm: string, observacao: string | null, motivo?: string) =>
    api.post<{ pagos: RepasseItemDto[] }>("/repasses/pagar-lote", { repasseIds, pagoEm, observacao }, { motivo }),
};

export const chavesRepasses = {
  lista: (pagos?: string) => ["repasses", pagos ?? "abertos"] as const,
};
