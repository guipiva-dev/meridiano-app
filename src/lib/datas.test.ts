import {
  competenciaAtual,
  competenciaDe,
  diasAte,
  formatarCarimbo,
  formatarData,
  formatarDataHora,
  formatarMesAno,
  formatarPeriodo,
  hojeIso,
  idade,
  nomeMes,
  somarMeses,
} from "./datas";

test("formatarData", () => {
  expect(formatarData("2026-04-18")).toBe("18/04/2026");
  expect(formatarData(null)).toBe("—");
  expect(formatarData(undefined)).toBe("—");
});

test("formatarDataHora", () => {
  expect(formatarDataHora("2026-04-18T23:15:00")).toBe("18/04/2026 23:15");
  expect(formatarDataHora(null)).toBe("—");
});

// timestamptz chega em UTC; o carimbo tem que sair no fuso do navegador (não fatiado da string).
test("formatarCarimbo converte o offset para o fuso local", () => {
  const iso = "2026-03-14T23:30:00Z";
  const esperado = new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  expect(formatarCarimbo(iso)).toBe(esperado);
  expect(formatarCarimbo("2026-03-14T23:30:00+00:00")).toBe(esperado);
  expect(formatarCarimbo(null)).toBe("—");
  // O bug que isto cobre: fatiar a string devolveria 23:30 em qualquer fuso.
  if (new Date(iso).getTimezoneOffset() !== 0) expect(formatarCarimbo(iso)).not.toContain("23:30");
});

test("formatarPeriodo", () => {
  expect(formatarPeriodo("2026-04-18", "2026-04-28")).toBe("18–28/04/2026");
  expect(formatarPeriodo("2026-04-28", "2026-05-02")).toBe("28/04–02/05/2026");
  expect(formatarPeriodo("2026-04-18", "2027-01-02")).toBe("18/04/2026–02/01/2027");
  expect(formatarPeriodo("2026-04-18", null)).toBe("18/04/2026");
  expect(formatarPeriodo(null, null)).toBe("—");
});

test("diasAte conta a partir de hoje, negativo se passado", () => {
  const hoje = new Date(hojeIso());
  const futuro = new Date(hoje);
  futuro.setDate(futuro.getDate() + 3);
  const passado = new Date(hoje);
  passado.setDate(passado.getDate() - 2);
  expect(diasAte(futuro.toISOString().slice(0, 10))).toBe(3);
  expect(diasAte(passado.toISOString().slice(0, 10))).toBe(-2);
  expect(diasAte(hojeIso())).toBe(0);
});

test("idade conta anos completos e ignora aniversário que ainda não chegou", () => {
  const [ano, mes, dia] = hojeIso().split("-");
  expect(idade(`${Number(ano) - 30}-${mes}-${dia}`)).toBe(30);
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const [anoA, mesA, diaA] = amanha.toLocaleDateString("en-CA").split("-");
  expect(idade(`${Number(anoA) - 30}-${mesA}-${diaA}`)).toBe(29);
  expect(idade(null)).toBeNull();
  expect(idade(undefined)).toBeNull();
});

test("competências: formatação, extração, atual e soma que vira o ano", () => {
  expect(formatarMesAno("2026-04-01")).toBe("abr/2026");
  expect(formatarMesAno(null)).toBe("—");
  expect(nomeMes("2026-04")).toBe("Abril de 2026");
  expect(competenciaDe("2026-04-18")).toBe("2026-04");
  expect(competenciaAtual()).toBe(hojeIso().slice(0, 7));
  expect(somarMeses("2026-12", 1)).toBe("2027-01");
  expect(somarMeses("2026-01", -1)).toBe("2025-12");
});
