import { calcularReserva, type ValoresReserva } from "./calculoReserva";

function V(
  valorTotal: number,
  valorComissao: number,
  ravOperadora: number,
  valorCliente: number,
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
