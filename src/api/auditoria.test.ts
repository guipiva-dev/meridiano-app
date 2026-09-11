import { auditoriaApi, urlCsv } from "./auditoria";

function resposta(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

let ultimaUrl = "";
beforeEach(() => {
  ultimaUrl = "";
  vi.stubGlobal("fetch", (url: string) => {
    ultimaUrl = url;
    return Promise.resolve(resposta({ itens: [], total: 0, proximoAntesDe: null, usuarios: [] }));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("listar sem filtros não acrescenta querystring", async () => {
  await auditoriaApi.listar({});
  expect(ultimaUrl).toBe("/api/v1/auditoria");
});

test("listar com filtros monta a querystring", async () => {
  await auditoriaApi.listar({ usuarioId: "u1", oque: "recebimentos", de: "2026-04-01", ate: "2026-04-07" });
  expect(ultimaUrl).toContain("usuarioId=u1");
  expect(ultimaUrl).toContain("oque=recebimentos");
  expect(ultimaUrl).toContain("de=2026-04-01");
  expect(ultimaUrl).toContain("ate=2026-04-07");
});

test("antesDe vai codificado na querystring", async () => {
  await auditoriaApi.listar({ antesDe: "2026-04-07T16:40:00+00:00" });
  expect(ultimaUrl).toContain(`antesDe=${encodeURIComponent("2026-04-07T16:40:00+00:00")}`);
});

test("urlCsv não inclui cursor nem tamanho", () => {
  const url = urlCsv({ usuarioId: "u1", oque: "recebimentos", antesDe: "x", tamanho: 25 });
  expect(url).toBe("/api/v1/auditoria/csv?usuarioId=u1&oque=recebimentos");
});

test("urlCsv sem filtros", () => {
  expect(urlCsv({})).toBe("/api/v1/auditoria/csv");
});
