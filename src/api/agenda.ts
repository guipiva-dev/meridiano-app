import { api } from "./http";
import type { PendenciaDto } from "./pendencias";

export interface AgendaCabecalhoDto {
  hoje: string;
  pendenciasHoje: number;
  atrasadas: number;
  embarquesSemana: number;
}

export interface AgendaPendenciasDto {
  atrasadas: PendenciaDto[];
  hoje: PendenciaDto[];
  semana: PendenciaDto[];
  total: number;
}

export interface EmbarqueDto {
  viagemId: string;
  codigo: string;
  titular: string | null;
  destino: string;
  dataIda: string;
  numPax: number;
  faseOperacional: string;
}

export interface RetornoDto {
  viagemId: string;
  codigo: string;
  titular: string | null;
  destino: string;
  dataVolta: string;
  posViagemEm: string | null;
}

export interface DocumentoVencendoDto {
  clienteId: string;
  clienteNome: string;
  tipo: string;
  numero: string | null;
  validade: string | null;
  diasParaVencer: number | null;
  proximaViagemId: string | null;
  proximaViagemDestino: string | null;
  proximaViagemIda: string | null;
  situacao: "na_agenda" | "so_cadastro";
  pendenciaId: string | null;
}

export interface CreditoVencendoDto {
  creditoId: string;
  clienteId: string;
  clienteNome: string;
  fornecedorNome: string;
  origem: string;
  viagemOrigemId: string | null;
  validade: string;
  diasParaVencer: number;
  valor: number;
}

export interface ResponsavelAgendaDto {
  id: string;
  nome: string;
}

export interface AgendaDto {
  cabecalho: AgendaCabecalhoDto;
  pendencias: AgendaPendenciasDto;
  embarques: EmbarqueDto[];
  retornos: RetornoDto[];
  documentos: DocumentoVencendoDto[];
  creditos: CreditoVencendoDto[];
  responsaveis: ResponsavelAgendaDto[];
}

export interface BadgesDto {
  agenda: number;
  financeiro: number | null;
  clientes: number | null;
}

export const agendaApi = {
  listar: (responsavelId: string | null) => {
    const qs = new URLSearchParams();
    if (responsavelId) qs.set("responsavelId", responsavelId);
    const q = qs.toString();
    return api.get<AgendaDto>(`/agenda${q ? `?${q}` : ""}`);
  },
  badges: () => api.get<BadgesDto>("/agenda/badges"),
};

export const chavesAgenda = {
  lista: (responsavelId: string | null) => ["agenda", responsavelId] as const,
  badges: () => ["agenda", "badges"] as const,
};
