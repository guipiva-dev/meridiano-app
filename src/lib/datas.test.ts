import { diasAte, formatarCarimbo, formatarData, formatarDataHora, formatarPeriodo, hojeIso } from "./datas";

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
