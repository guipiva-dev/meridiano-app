import type { JanelaDto } from "./fornecedores";
import { descreverJanela, resumoRegra } from "./fornecedores";

const JANELAS_CVC: JanelaDto[] = [
  { diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 },
  { diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 },
];

test("resumoRegra com janelas da CVC", () => {
  expect(resumoRegra(JANELAS_CVC, null)).toBe("1–14 → dia 20 · 15–31 → dia 5 (mês seguinte)");
});

test("resumoRegra sem janelas com prazo", () => {
  expect(resumoRegra([], 30)).toBe("30 dias após a compra");
});

test("resumoRegra sem janelas nem prazo", () => {
  expect(resumoRegra([], null)).toBe("—");
});

test("resumoRegra com janela +2 meses", () => {
  const janelas: JanelaDto[] = [{ diaInicial: 1, diaFinal: 31, diaPagamento: 10, mesesAFrente: 2 }];
  expect(resumoRegra(janelas, null)).toBe("1–31 → dia 10 (+2 meses)");
});

test("descreverJanela do mesmo mês", () => {
  expect(descreverJanela({ diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 })).toEqual({
    titulo: "Vendas de 1 a 14",
    sub: "pagam dia 20 do mesmo mês",
  });
});

test("descreverJanela do mês seguinte", () => {
  expect(descreverJanela({ diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 }).sub).toBe(
    "pagam dia 5 do mês seguinte",
  );
});
