import { erroDeResposta, NetworkError } from "@/api/errors";

// Baixa via <a download>: o navegador cuida do arquivo, sem blob nem fetch — o CSV vem pronto da API.
export function baixar(url: string, nomeArquivo?: string): void {
  const a = document.createElement("a");
  a.href = url;
  if (nomeArquivo) a.download = nomeArquivo;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Baixa via fetch, com feedback de erro (MED-04). `baixar` via <a href> não serve aqui: uma
 * resposta não-2xx (sessão expirada, sem permissão) navegaria a aba para o JSON de erro sem
 * aviso. Aqui a resposta é checada antes de virar arquivo.
 */
export async function baixarComFeedback(url: string, nomeArquivo: string): Promise<void> {
  let resposta: Response;
  try {
    resposta = await fetch(url, { credentials: "same-origin" });
  } catch {
    throw new NetworkError();
  }
  if (!resposta.ok) {
    const tipo = resposta.headers.get("content-type") ?? "";
    let json: unknown = null;
    if (tipo.includes("json")) {
      try {
        json = await resposta.json();
      } catch {
        // segue com json nulo: erroDeResposta cai na mensagem genérica do status
      }
    }
    throw erroDeResposta(resposta.status, json as Parameters<typeof erroDeResposta>[1]);
  }
  const blob = await resposta.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    baixar(objectUrl, nomeArquivo);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
