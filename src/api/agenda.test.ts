import { agendaApi, chavesAgenda } from "./agenda";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

let ultimaUrl = "";
beforeEach(() => {
  ultimaUrl = "";
  vi.stubGlobal("fetch", (url: string) => {
    ultimaUrl = url;
    return Promise.resolve(resposta(200, {}));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("listar sem responsavelId monta /agenda sem query string", async () => {
  await agendaApi.listar(null);
  expect(ultimaUrl).toBe("/api/v1/agenda");
});

test("listar com responsavelId monta /agenda?responsavelId=...", async () => {
  await agendaApi.listar("u1");
  expect(ultimaUrl).toBe("/api/v1/agenda?responsavelId=u1");
});

test("badges monta /agenda/badges", async () => {
  await agendaApi.badges();
  expect(ultimaUrl).toBe("/api/v1/agenda/badges");
});

test("chavesAgenda.lista inclui o responsavelId na chave", () => {
  expect(chavesAgenda.lista("u1")).toEqual(["agenda", "u1"]);
  expect(chavesAgenda.lista(null)).toEqual(["agenda", null]);
});

test("chavesAgenda.badges é estável", () => {
  expect(chavesAgenda.badges()).toEqual(["agenda", "badges"]);
});
