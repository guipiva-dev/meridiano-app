import { formatarDinheiro, parsearDinheiro } from "./dinheiro";

test("formata pt-BR com duas casas", () => {
  expect(formatarDinheiro(1234.5)).toBe("R$ 1.234,50");
  expect(formatarDinheiro(0)).toBe("R$ 0,00");
  expect(formatarDinheiro(-10)).toBe("−R$ 10,00");
  expect(formatarDinheiro(null)).toBe("");
});

test("parseia o que a pessoa digita", () => {
  expect(parsearDinheiro("1.234,56")).toBe(1234.56);
  expect(parsearDinheiro("R$ 1.234,56")).toBe(1234.56);
  expect(parsearDinheiro("1234,5")).toBe(1234.5);
  expect(parsearDinheiro("1234")).toBe(1234);
  expect(parsearDinheiro("-50,00")).toBe(-50);
  expect(parsearDinheiro("")).toBeNull();
  expect(parsearDinheiro("abc")).toBeNull();
});
