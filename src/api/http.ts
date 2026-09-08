import { ApiError, erroDeResposta, NetworkError } from "./errors";

export { mensagemDeErro } from "./errors";

const BASE = "/api/v1";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${path}`, {
      method,
      credentials: "same-origin",
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
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
  post: <T = void>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T = void>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: (path: string): Promise<void> => request("DELETE", path),
};
