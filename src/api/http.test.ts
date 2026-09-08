import { ConflictError, NetworkError, UnauthenticatedError, ValidationError } from "./errors";
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
