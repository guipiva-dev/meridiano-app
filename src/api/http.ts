import { ApiError, erroDeResposta, NetworkError } from "./errors";

export { mensagemDeErro } from "./errors";

const BASE = "/api/v1";
/** Request presa não pode virar spinner infinito: fetch aborta e cai no catch (TimeoutError → NetworkError). */
const TIMEOUT_MS = 30_000;

/** `motivo` justifica escrita auditada (período fechado, exclusão). Viaja no header, percent-encoded. */
export interface OpcoesRequest {
  motivo?: string;
}

async function request<T>(method: string, path: string, body?: unknown, opts?: OpcoesRequest): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // Header HTTP é ASCII: o backend faz o decodeURIComponent equivalente.
  if (opts?.motivo) headers["X-Motivo"] = encodeURIComponent(opts.motivo);
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${path}`, {
      method,
      credentials: "same-origin",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new NetworkError();
  }
  if (resposta.status === 204) return undefined as T;
  const tipo = resposta.headers.get("content-type") ?? "";
  let json: unknown = null;
  if (tipo.includes("json")) {
    try {
      json = await resposta.json();
    } catch {
      throw new ApiError(resposta.status, "resposta_invalida", "Resposta inválida do servidor");
    }
  }
  if (!resposta.ok) throw erroDeResposta(resposta.status, json as Parameters<typeof erroDeResposta>[1]);
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T = void>(path: string, body?: unknown, opts?: OpcoesRequest) => request<T>("POST", path, body, opts),
  put: <T = void>(path: string, body: unknown, opts?: OpcoesRequest) => request<T>("PUT", path, body, opts),
  delete: (path: string, opts?: OpcoesRequest): Promise<void> => request("DELETE", path, undefined, opts),
};
