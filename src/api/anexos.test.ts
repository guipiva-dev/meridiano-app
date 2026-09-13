import { enviarArquivo } from "./anexos";

const arquivo = new File(["x"], "voucher.pdf", { type: "application/pdf" });

afterEach(() => {
  vi.restoreAllMocks();
});

test("enviarArquivo envia PUT com timeout e, ao falhar (rede/timeout/mixed content), inclui o host na mensagem", async () => {
  const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("timeout", "TimeoutError"));

  await expect(enviarArquivo("https://r2/upload", arquivo)).rejects.toThrow("sem conexão com r2");

  const init = spy.mock.calls[0]?.[1];
  expect(init?.method).toBe("PUT");
  expect(init?.signal).toBeInstanceOf(AbortSignal);
});

test("enviarArquivo com resposta não-ok lança erro com o host e o status HTTP", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 403 } as Response);

  await expect(enviarArquivo("https://r2/upload", arquivo)).rejects.toThrow("r2 recusou o arquivo (HTTP 403)");
});

test("enviarArquivo com URL inválida lança erro legível em vez de TypeError", async () => {
  await expect(enviarArquivo("nao-e-url", arquivo)).rejects.toThrow("URL de upload inválida");
});
