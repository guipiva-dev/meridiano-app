import { qsRelatorios, urlCsv } from "./relatorios";

test("qsRelatorios com ano e vendedor gera as duas chaves", () => {
  expect(qsRelatorios(2025, "v1")).toBe("ano=2025&vendedorId=v1");
});

test("qsRelatorios sem filtros gera string vazia", () => {
  expect(qsRelatorios(null, null)).toBe("");
});

test("urlCsv monta a rota de export com os filtros atuais", () => {
  expect(urlCsv(2026, null)).toBe("/api/v1/relatorios/csv?ano=2026");
  expect(urlCsv(2026, "v1")).toBe("/api/v1/relatorios/csv?ano=2026&vendedorId=v1");
});

test("urlCsv sem filtros aponta para a rota sem query", () => {
  expect(urlCsv(null, null)).toBe("/api/v1/relatorios/csv?");
});
