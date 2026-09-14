import { calcularReserva, type ValoresReserva } from "./calculoReserva";

function V(
  valorTotal: number,
  valorComissao: number,
  ravOperadora: number,
  valorCliente: number | null,
  opts: Partial<Pick<ValoresReserva, "taxaServico" | "viaOperadora" | "cancelada" | "comissaoMantida">> = {},
): ValoresReserva {
  return {
    valorTotal,
    valorComissao,
    ravOperadora,
    valorCliente,
    taxaServico: opts.taxaServico ?? 0,
    viaOperadora: opts.viaOperadora ?? false,
    cancelada: opts.cancelada,
    comissaoMantida: opts.comissaoMantida,
  };
}

test("A: comissionada simples", () => {
  const r = calcularReserva(V(10000, 1000, 100, 10000));
  expect(r.ravCliente).toBe(0);
  expect(r.valorEsperadoOperadora).toBe(1100);
  expect(r.receitaPrevista).toBe(1100);
  expect(r.percentualComissao).toBe(10);
});

test("B: rav cliente via operadora", () => {
  const r = calcularReserva(V(10000, 1000, 100, 10500, { viaOperadora: true }));
  expect(r.ravCliente).toBe(500);
  expect(r.valorEsperadoOperadora).toBe(1600);
  expect(r.receitaPrevista).toBe(1600);
});

test("C: rav cliente retido", () => {
  const r = calcularReserva(V(10000, 1000, 100, 10500));
  expect(r.ravCliente).toBe(500);
  expect(r.valorEsperadoOperadora).toBe(1100);
  expect(r.receitaPrevista).toBe(1600);
});

test("D: markup", () => {
  const r = calcularReserva(V(800, 0, 0, 1000));
  expect(r.ravCliente).toBe(200);
  expect(r.valorEsperadoOperadora).toBe(0);
  expect(r.receitaPrevista).toBe(200);
  expect(r.percentualComissao).toBe(0);
});

test("E: cancelada sem comissão mantida zera", () => {
  const r = calcularReserva(V(10000, 1000, 100, 10500, { viaOperadora: true, cancelada: true }));
  expect(r.valorEsperadoOperadora).toBe(0);
  expect(r.receitaPrevista).toBe(0);
  expect(r.ravCliente).toBe(500);
});

test("cancelada com comissão mantida mantém", () => {
  const r = calcularReserva(V(10000, 1000, 100, 10000, { cancelada: true, comissaoMantida: true }));
  expect(r.valorEsperadoOperadora).toBe(1100);
});

test("percentual nulo sem total", () => {
  expect(calcularReserva(V(0, 0, 0, 0)).percentualComissao).toBeNull();
});

test("percentual arredonda como o banco", () => {
  expect(calcularReserva(V(300, 100, 0, 300)).percentualComissao).toBe(33.33);
});

test("A03: valorCliente null vira ravCliente null (nunca −total)", () => {
  const r = calcularReserva(V(10000, 1000, 100, null));
  expect(r.ravCliente).toBeNull();
});

test("review 1: valorCliente null também zera esperado/receita para null (nunca um número bogus)", () => {
  const r = calcularReserva(V(10000, 1000, 100, null, { viaOperadora: true }));
  expect(r.valorEsperadoOperadora).toBeNull();
  expect(r.receitaPrevista).toBeNull();
});

test("review 1: cancelada sem venda informada ainda zera esperado/receita (não vira null)", () => {
  const r = calcularReserva(V(10000, 1000, 100, null, { cancelada: true }));
  expect(r.valorEsperadoOperadora).toBe(0);
  expect(r.receitaPrevista).toBe(0);
});

test("A12: esperado da operadora pode ficar negativo (venda muito abaixo do custo, via operadora)", () => {
  const r = calcularReserva(V(10000, 1000, 100, 2000, { viaOperadora: true }));
  expect(r.valorEsperadoOperadora).toBe(-6900);
});

test("sem erro de ponto flutuante: 0.3 - 0.1 = 0.2 exato", () => {
  expect(
    calcularReserva({
      valorTotal: 0.1,
      valorComissao: 0.2,
      ravOperadora: 0,
      valorCliente: 0.3,
      taxaServico: 0,
      viaOperadora: false,
    }).ravCliente,
  ).toBe(0.2);
});

test("totalComissao = comissão + RAV da operadora + RAV do cliente", () => {
  const r = calcularReserva({
    valorTotal: 10000,
    valorComissao: 1000,
    ravOperadora: 0,
    valorCliente: 10500,
    taxaServico: 150,
    viaOperadora: true,
  });
  expect(r.totalComissao).toBe(1500);
  expect(r.receitaPrevista).toBe(1650);
});

test("totalComissao com desconto (RAV negativo)", () => {
  const r = calcularReserva({
    valorTotal: 10000,
    valorComissao: 1000,
    ravOperadora: 0,
    valorCliente: 9800,
    taxaServico: 0,
    viaOperadora: true,
  });
  expect(r.totalComissao).toBe(800);
});

test("totalComissao null sem venda; 0 se cancelada sem comissão mantida", () => {
  const base = { valorTotal: 10000, valorComissao: 1000, ravOperadora: 0, taxaServico: 0, viaOperadora: true };
  expect(calcularReserva({ ...base, valorCliente: null }).totalComissao).toBeNull();
  expect(calcularReserva({ ...base, valorCliente: null, cancelada: true }).totalComissao).toBe(0);
});
