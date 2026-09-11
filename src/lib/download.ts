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
