import { api, TIMEOUT_MS } from "./http";

export type TipoAnexo = "voucher" | "comprovante" | "documento" | "contrato" | "extrato" | "outro";

export interface AnexoDto {
  id: string;
  vinculo: "cliente" | "viagem" | "reserva";
  clienteId: string | null;
  viagemId: string | null;
  reservaId: string | null;
  tipo: TipoAnexo;
  nomeArquivo: string;
  mimeType: string | null;
  tamanhoBytes: number | null;
  sensivel: boolean;
  dataDescarte: string | null;
  enviadoPorNome: string | null;
  criadoEm: string;
}

export interface NovoAnexoRequest {
  clienteId?: string;
  viagemId?: string;
  reservaId?: string;
  tipo: TipoAnexo;
  nomeArquivo: string;
  mimeType: string | null;
  tamanhoBytes: number | null;
  sensivel: boolean;
  dataDescarte: string | null;
}

export const anexosApi = {
  daViagem: (viagemId: string) => api.get<AnexoDto[]>(`/viagens/${viagemId}/anexos`),
  iniciar: (r: NovoAnexoRequest) => api.post<{ anexo: AnexoDto; urlUpload: string }>("/anexos", r),
  confirmar: (id: string) => api.post<AnexoDto>(`/anexos/${id}/confirmar`),
  urlDownload: (id: string) => api.get<{ url: string }>(`/anexos/${id}/download`),
  excluir: (id: string) => api.delete(`/anexos/${id}`),
};

export async function enviarArquivo(urlUpload: string, arquivo: File): Promise<void> {
  const host = new URL(urlUpload).host;
  let resposta: Response;
  try {
    // Mesmo timeout do cliente HTTP: upload preso não vira spinner infinito.
    resposta = await fetch(urlUpload, {
      method: "PUT",
      body: arquivo,
      headers: { "Content-Type": arquivo.type },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Cobre rede, timeout e mixed content (PUT bloqueado pelo navegador): a exceção não diz o motivo,
    // mas o host do destino já ajuda a diagnosticar (ex.: endpoint de storage apontando para localhost).
    throw new Error(`sem conexão com ${host}`);
  }
  if (!resposta.ok) throw new Error(`${host} recusou o arquivo (HTTP ${resposta.status})`);
}

export const chavesAnexos = {
  daViagem: (viagemId: string) => ["viagens", viagemId, "anexos"] as const,
};
