import { afterEach, expect, test, vi } from "vitest";
import { idade } from "./datas";
import { faixaEtaria, textoIdade } from "./idade";

afterEach(() => {
  vi.useRealTimers();
});

test("anos completos: aniversário no próprio dia conta", () => {
  expect(idade("2020-10-01", "2022-09-30")).toBe(1); // 1 ano e 364 dias
  expect(idade("2020-10-01", "2022-10-01")).toBe(2); // 2 anos exatos
  expect(idade("2014-10-01", "2026-09-30")).toBe(11);
  expect(idade("2014-10-01", "2026-10-01")).toBe(12);
});

test("29/02 em ano não bissexto faz aniversário em 01/03", () => {
  expect(idade("2020-02-29", "2021-02-28")).toBe(0);
  expect(idade("2020-02-29", "2021-03-01")).toBe(1);
  expect(idade("2020-02-29", "2024-02-29")).toBe(4);
});

test("faixa etária: < 2 bebê, 2–11 criança, ≥ 12 nada", () => {
  expect(faixaEtaria(0)).toBe("bebê");
  expect(faixaEtaria(1)).toBe("bebê");
  expect(faixaEtaria(2)).toBe("criança");
  expect(faixaEtaria(11)).toBe("criança");
  expect(faixaEtaria(12)).toBeNull();
});

test("texto da idade com plural e faixa", () => {
  expect(textoIdade("2019-01-01", "2026-10-01")).toBe("7 anos · criança");
  expect(textoIdade("2025-01-01", "2026-10-01")).toBe("1 ano · bebê");
  expect(textoIdade("2026-05-01", "2026-10-01")).toBe("0 anos · bebê");
  expect(textoIdade("1980-05-05", "2026-10-01")).toBe("46 anos");
});

test("sem nascimento → null; sem data de referência usa hoje", () => {
  expect(textoIdade(null, "2026-10-01")).toBeNull();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 14, 12));
  expect(textoIdade("2024-09-14", null)).toBe("2 anos · criança");
  expect(textoIdade("2024-09-15", "")).toBe("1 ano · bebê");
});
