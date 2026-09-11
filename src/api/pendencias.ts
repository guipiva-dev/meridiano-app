import { api } from "./http";

export type Prioridade = "normal" | "urgente";

export interface PendenciaDto {
  id: string;
  versao: string;
  titulo: string;
  descricao: string | null;
  dataPrevista: string;
  responsavelId: string | null;
  responsavelNome: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  viagemId: string | null;
  codigoViagem: string | null;
  status: "aberta" | "concluida" | "cancelada";
  origem: "manual" | "automatica";
  prioridade: Prioridade;
  adiadaDe: string | null;
  concluidaEm: string | null;
  atrasada: boolean;
}

export interface NovaPendenciaRequest {
  titulo: string;
  descricao: string | null;
  dataPrevista: string;
  responsavelId: string | null;
  prioridade: Prioridade;
  clienteIds: string[];
}

export interface PendenciaRequest {
  titulo: string;
  descricao: string | null;
  dataPrevista: string;
  responsavelId: string | null;
  prioridade: Prioridade;
  versao: string;
}

export const pendenciasApi = {
  daViagem: (viagemId: string, incluirConcluidas: boolean) =>
    api.get<PendenciaDto[]>(`/viagens/${viagemId}/pendencias?incluirConcluidas=${incluirConcluidas}`),
  criar: (viagemId: string, r: NovaPendenciaRequest) => api.post<PendenciaDto[]>(`/viagens/${viagemId}/pendencias`, r),
  atualizar: (id: string, r: PendenciaRequest) => api.put<PendenciaDto>(`/pendencias/${id}`, r),
  concluir: (id: string, versao: string) => api.post<PendenciaDto>(`/pendencias/${id}/concluir`, { versao }),
  adiar: (id: string, novaData: string, versao: string) =>
    api.post<PendenciaDto>(`/pendencias/${id}/adiar`, { novaData, versao }),
  cancelar: (id: string) => api.delete(`/pendencias/${id}`),
  /** R3: pendência solta (sem viagem), criada a partir da Agenda. `clienteIds` pode ser vazio. */
  criarSolta: (r: NovaPendenciaRequest) => api.post<PendenciaDto[]>("/pendencias", r),
};

export const chavesPendencias = {
  daViagem: (viagemId: string, incluirConcluidas: boolean) =>
    ["viagens", viagemId, "pendencias", incluirConcluidas] as const,
};
