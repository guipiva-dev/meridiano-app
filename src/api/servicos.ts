import { api } from "./http";
import type { TipoServico } from "./viagens";

export interface ServicoDto {
  id: string;
  versao: string;
  reservaId: string;
  tipo: TipoServico;
  titulo: string;
  dataInicio: string | null;
  dataFim: string | null;
  localidade: string | null;
  localizadorCia: string | null;
  numeroBilhete: string | null;
  observacoes: string | null;
  ordem: number;
}

export interface ServicoRequest {
  tipo: TipoServico;
  titulo: string;
  dataInicio: string | null;
  dataFim: string | null;
  localidade: string | null;
  localizadorCia: string | null;
  numeroBilhete: string | null;
  observacoes: string | null;
  ordem: number;
  versao?: string;
}

export const servicosApi = {
  daReserva: (reservaId: string) => api.get<ServicoDto[]>(`/reservas/${reservaId}/servicos`),
  criar: (reservaId: string, r: ServicoRequest) => api.post<ServicoDto>(`/reservas/${reservaId}/servicos`, r),
  atualizar: (id: string, r: ServicoRequest) => api.put<ServicoDto>(`/servicos/${id}`, r),
  excluir: (id: string) => api.delete(`/servicos/${id}`),
};

export const chavesServicos = {
  daReserva: (reservaId: string) => ["reservas", reservaId, "servicos"] as const,
};
