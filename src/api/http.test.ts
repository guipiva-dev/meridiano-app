import { ApiError, ConflictError, NetworkError, UnauthenticatedError, ValidationError } from "./errors";
import { api, mensagemDeErro } from "./http";

function respostaProblem(status: number, body: object) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/problem+json" } });
}

beforeEach(() => vi.restoreAllMocks());

test("GET devolve JSON e envia credenciais", async () => {
  const spy = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(JSON.stringify({ nome: "x" }), { status: 200, headers: { "content-type": "application/json" } }),
    );
  const r = await api.get<{ nome: string }>("/auth/me");
  expect(r.nome).toBe("x");
  expect(spy).toHaveBeenCalledWith(
    "/api/v1/auth/me",
    expect.objectContaining({ method: "GET", credentials: "same-origin" }),
  );
});

test("204 devolve undefined", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
  await expect(api.post("/auth/logout")).resolves.toBeUndefined();
});

test("422 vira ValidationError com codigo", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    respostaProblem(422, { status: 422, title: "Regra de negócio", detail: "Senha curta", codigo: "senha_curta" }),
  );
  const e = await api.post("/auth/definir-senha", {}).catch((x: unknown) => x);
  expect(e).toBeInstanceOf(ValidationError);
  expect((e as ValidationError).codigo).toBe("senha_curta");
  expect(mensagemDeErro(e)).toBe("Senha curta");
});

test("409 vira ConflictError com mensagem de recarregar", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    respostaProblem(409, { status: 409, detail: "alterado", codigo: "conflito_concorrencia" }),
  );
  const e = await api.put("/usuarios/1", {}).catch((x: unknown) => x);
  expect(e).toBeInstanceOf(ConflictError);
  expect(mensagemDeErro(e)).toMatch(/Recarregue/);
});

test("401 sem corpo vira UnauthenticatedError", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  await expect(api.get("/auth/me")).rejects.toBeInstanceOf(UnauthenticatedError);
});

test("falha de rede vira NetworkError", async () => {
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
  const e = await api.get("/x").catch((x: unknown) => x);
  expect(e).toBeInstanceOf(NetworkError);
  expect(mensagemDeErro(e)).toMatch(/Sem conexão/);
});

// C2: o motivo viaja em header, percent-encoded (header HTTP não aceita acento nem quebra de linha).
test("envia X-Motivo codificado quando opts.motivo vem", async () => {
  const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
  await api.delete("/fechamento/2026-04", { motivo: "erro de lançamento ç" });
  expect(spy.mock.calls[0]?.[1]?.headers).toMatchObject({ "X-Motivo": "erro%20de%20lan%C3%A7amento%20%C3%A7" });

  await api.post("/x", { a: 1 });
  expect(spy.mock.calls[1]?.[1]?.headers).not.toHaveProperty("X-Motivo");
});

test("JSON malformado vira ApiError resposta_invalida", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("{", { status: 200, headers: { "content-type": "application/json" } }),
  );
  const e = await api.get("/x").catch((x: unknown) => x);
  expect(e).toBeInstanceOf(ApiError);
  expect((e as ApiError).codigo).toBe("resposta_invalida");
});

// T5: request preso não pode virar spinner infinito — timeout do fetch vira NetworkError.
test("timeout do fetch vira NetworkError e envia signal", async () => {
  const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("timeout", "TimeoutError"));
  await expect(api.get("/x")).rejects.toBeInstanceOf(NetworkError);
  expect(spy.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
});
