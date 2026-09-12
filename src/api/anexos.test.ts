import { enviarArquivo } from "./anexos";
import { NetworkError } from "./errors";

const arquivo = new File(["x"], "voucher.pdf", { type: "application/pdf" });

afterEach(() => {
  vi.restoreAllMocks();
});

test("enviarArquivo envia signal de timeout e o TimeoutError vira NetworkError", async () => {
  const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("timeout", "TimeoutError"));

  await expect(enviarArquivo("https://r2/upload", arquivo)).rejects.toBeInstanceOf(NetworkError);

  const init = spy.mock.calls[0]?.[1];
  expect(init?.method).toBe("PUT");
  expect(init?.signal).toBeInstanceOf(AbortSignal);
});

test("enviarArquivo com resposta não-ok lança erro de envio", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 403 } as Response);

  await expect(enviarArquivo("https://r2/upload", arquivo)).rejects.toThrow("Falha ao enviar o arquivo");
});
