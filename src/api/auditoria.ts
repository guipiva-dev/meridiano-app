import { api } from "./http";

export interface AlteracaoDto {
  de: unknown;
  para: unknown;
}

export interface EventoAuditoriaDto {
  id: number;
  tabela: string;
  registroId: string;
  acao: "INSERT" | "UPDATE" | "DELETE" | "ACESSO";
  titulo: string;
  subtitulo: string | null;
  alteracoes: Record<string, AlteracaoDto>;
  motivo: string | null;
  usuarioNome: string | null;
  criadoEm: string;
  viagemId?: string | null;
  codigoViagem?: string | null;
}

export type OqueAuditoria = "tudo" | "valores" | "recebimentos" | "cancelamentos" | "acesso_documento";

export interface FiltroAuditoria {
  usuarioId?: string;
  oque?: OqueAuditoria;
  de?: string;
  ate?: string;
  antesDe?: string;
  antesDeId?: number;
  tamanho?: number;
}

export interface ResponsavelDto {
  id: string;
  nome: string;
}

export interface AuditoriaDto {
  itens: EventoAuditoriaDto[];
  total: number;
  proximoAntesDe: string | null;
  proximoAntesDeId: number | null;
  usuarios: ResponsavelDto[];
}

function querystring(f: FiltroAuditoria): string {
  const p = new URLSearchParams();
  if (f.usuarioId) p.set("usuarioId", f.usuarioId);
  if (f.oque) p.set("oque", f.oque);
  if (f.de) p.set("de", f.de);
  if (f.ate) p.set("ate", f.ate);
  if (f.antesDe) p.set("antesDe", f.antesDe);
  if (f.antesDeId != null) p.set("antesDeId", String(f.antesDeId));
  if (f.tamanho) p.set("tamanho", String(f.tamanho));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const auditoriaApi = {
  daViagem: (id: string) => api.get<EventoAuditoriaDto[]>(`/viagens/${id}/auditoria`),
  listar: (f: FiltroAuditoria) => api.get<AuditoriaDto>(`/auditoria${querystring(f)}`),
};

/** CSV não usa cursor (`antesDe`/`antesDeId`/`tamanho`): sempre o filtro ativo, sem paginação. */
export function urlCsv(f: FiltroAuditoria): string {
  const { usuarioId, oque, de, ate } = f;
  return `/api/v1/auditoria/csv${querystring({ usuarioId, oque, de, ate })}`;
}

export const chavesAuditoria = {
  daViagem: (id: string) => ["viagens", id, "auditoria"] as const,
  lista: (f: FiltroAuditoria) => ["auditoria", f] as const,
};
