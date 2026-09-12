import { baixar, baixarComFeedback } from "./download";

test("baixar cria um <a> com href/download, clica e remove", () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.getAttribute("href")).toBe("/x.csv");
    expect(this.download).toBe("x.csv");
    expect(this.rel).toBe("noopener");
    expect(document.body.contains(this)).toBe(true);
  });

  baixar("/x.csv", "x.csv");

  expect(click).toHaveBeenCalledTimes(1);
  expect(document.querySelector("a[href='/x.csv']")).toBeNull();
  click.mockRestore();
});

function resposta(status: number, body: unknown, contentType = "application/json") {
  return {
    ok: status < 300,
    status,
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob(["a,b"])),
  } as unknown as Response;
}

let createObjectURL: ReturnType<typeof vi.fn<(obj: Blob | MediaSource) => string>>;
let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>;

beforeEach(() => {
  createObjectURL = vi.fn(() => "blob:x");
  revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("baixarComFeedback com resposta ok baixa o blob e revoga a URL só 1 s após o clique (MED-04; Firefox)", async () => {
  vi.useFakeTimers();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockReturnValue(undefined);
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, null, "text/csv")));

  await baixarComFeedback("/api/v1/x.csv", "x.csv");

  expect(click).toHaveBeenCalledTimes(1);
  expect(createObjectURL).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(999);
  expect(revokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:x");
  click.mockRestore();
});

test("baixarComFeedback com resposta não-2xx e JSON inválido lança ApiError resposta_invalida, como http.ts", async () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockReturnValue(undefined);
  const quebrada = resposta(500, null);
  quebrada.json = () => Promise.reject(new SyntaxError("bad json"));
  vi.stubGlobal("fetch", () => Promise.resolve(quebrada));

  await expect(baixarComFeedback("/api/v1/x.csv", "x.csv")).rejects.toMatchObject({
    codigo: "resposta_invalida",
    status: 500,
    message: "Resposta inválida do servidor",
  });

  expect(click).not.toHaveBeenCalled();
  click.mockRestore();
});

test("baixarComFeedback com resposta não-2xx lança erro com a mensagem do ProblemDetails, sem baixar (MED-04)", async () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockReturnValue(undefined);
  vi.stubGlobal("fetch", () =>
    Promise.resolve(resposta(403, { codigo: "sem_permissao", detail: "Você não pode exportar isso" })),
  );

  await expect(baixarComFeedback("/api/v1/x.csv", "x.csv")).rejects.toThrow("Você não pode exportar isso");

  expect(click).not.toHaveBeenCalled();
  click.mockRestore();
});

test("baixarComFeedback sem conexão lança NetworkError", async () => {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("boom")));

  await expect(baixarComFeedback("/api/v1/x.csv", "x.csv")).rejects.toThrow("Sem conexão");
});
