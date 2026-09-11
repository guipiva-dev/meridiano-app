import { chavesEquipe, equipeApi } from "./equipe";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

let ultima: { url: string; method?: string; body?: unknown } = { url: "" };
beforeEach(() => {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    ultima = { url, method: init?.method, body: init?.body ? JSON.parse(init.body as string) : undefined };
    return Promise.resolve(resposta(200, {}));
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

test("listar busca /usuarios", async () => {
  await equipeApi.listar();
  expect(ultima.url).toBe("/api/v1/usuarios");
});

test("obter busca /usuarios/{id}", async () => {
  await equipeApi.obter("u1");
  expect(ultima.url).toBe("/api/v1/usuarios/u1");
});

test("criar envia POST /usuarios com o corpo", async () => {
  await equipeApi.criar({
    nome: "Bruno",
    email: "b@x.com",
    telefone: null,
    perfil: "agente",
    geraRepasse: false,
    percentualPadrao: 0,
  });
  expect(ultima.url).toBe("/api/v1/usuarios");
  expect(ultima.method).toBe("POST");
  expect(ultima.body).toMatchObject({ nome: "Bruno" });
});

test("atualizar envia PUT /usuarios/{id} com a versao", async () => {
  await equipeApi.atualizar("u1", {
    nome: "Bruno",
    telefone: null,
    perfil: "agente",
    geraRepasse: false,
    percentualPadrao: 0,
    ativo: true,
    versao: "v1",
  });
  expect(ultima.url).toBe("/api/v1/usuarios/u1");
  expect(ultima.method).toBe("PUT");
  expect(ultima.body).toMatchObject({ versao: "v1" });
});

test("convidar envia POST /usuarios/{id}/convite", async () => {
  await equipeApi.convidar("u1");
  expect(ultima.url).toBe("/api/v1/usuarios/u1/convite");
  expect(ultima.method).toBe("POST");
});

test("convidarNovo envia POST /auth/convites", async () => {
  await equipeApi.convidarNovo({ nome: "Bruno", email: "b@x.com", perfil: "agente" });
  expect(ultima.url).toBe("/api/v1/auth/convites");
  expect(ultima.method).toBe("POST");
});

test("perfis busca /usuarios/perfis", async () => {
  await equipeApi.perfis();
  expect(ultima.url).toBe("/api/v1/usuarios/perfis");
});

test("chaves de query são estáveis", () => {
  expect(chavesEquipe.lista()).toEqual(["equipe"]);
  expect(chavesEquipe.item("u1")).toEqual(["equipe", "u1"]);
  expect(chavesEquipe.perfis()).toEqual(["equipe", "perfis"]);
});
