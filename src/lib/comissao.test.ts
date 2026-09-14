import { comissaoPorPercentual, parsearPercentual, percentualDaComissao } from "./comissao";

test("parsearPercentual aceita inteiro, vírgula e ponto; vazio é null", () => {
  expect(parsearPercentual("6")).toBe(6);
  expect(parsearPercentual("6,5")).toBe(6.5);
  expect(parsearPercentual("6.25")).toBe(6.25);
  expect(parsearPercentual("6,")).toBe(6);
  expect(parsearPercentual(" ")).toBeNull();
});

test("parsearPercentual: negativo, texto e mais de 2 casas são inválidos", () => {
  expect(parsearPercentual("-6")).toBe("negativo");
  expect(parsearPercentual("-")).toBe("negativo");
  expect(parsearPercentual("abc")).toBe("invalido");
  expect(parsearPercentual("6,555")).toBe("invalido");
  expect(parsearPercentual("1,2,3")).toBe("invalido");
});

test("comissaoPorPercentual arredonda meio para cima em centavos", () => {
  expect(comissaoPorPercentual(6, 2000)).toBe(120);
  expect(comissaoPorPercentual(6.5, 1234.56)).toBe(80.25);
  expect(comissaoPorPercentual(5, 10.1)).toBe(0.51); // 0,505 exato → 0,51 (float cru daria 0,50)
  expect(comissaoPorPercentual(10, null)).toBe(0);
});

test("percentualDaComissao: valor/total × 100 com 2 casas; total 0 ou vazio → null", () => {
  expect(percentualDaComissao(120, 2000)).toBe(6);
  expect(percentualDaComissao(100, 3000)).toBe(3.33);
  expect(percentualDaComissao(100, 0)).toBeNull();
  expect(percentualDaComissao(100, null)).toBeNull();
  expect(percentualDaComissao(null, 2000)).toBeNull();
});
