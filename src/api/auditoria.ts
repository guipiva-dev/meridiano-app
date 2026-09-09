import { api } from "./http";

export interface AlteracaoDto {
  de: unknown;
  para: unknown;
}

export interface EventoAuditoriaDto {
  id: number;
  tabela: string;
  registroId: string;
  acao: "INSERT" | "UPDATE" | "DELETE";
  titulo: string;
  subtitulo: string | null;
  alteracoes: Record<string, AlteracaoDto>;
  motivo: string | null;
  usuarioNome: string | null;
  criadoEm: string;
}

export const auditoriaApi = {
  daViagem: (id: string) => api.get<EventoAuditoriaDto[]>(`/viagens/${id}/auditoria`),
};

export const chavesAuditoria = {
  daViagem: (id: string) => ["viagens", id, "auditoria"] as const,
};
