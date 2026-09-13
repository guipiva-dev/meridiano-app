import { act } from "@testing-library/react";
import { chamadas, esperar, montar, reiniciar } from "./useNovaViagem.harness";

beforeEach(reiniciar);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("A04: tocar o campo Fornecedor sem salvar já mostra o erro", async () => {
  const { result } = montar();
  await esperar.agencia(result);

  act(() => {
    result.current.adicionarReserva();
  });
  expect(result.current.errosReservas[0]?.fornecedorId).toBeUndefined();

  act(() => {
    result.current.atualizarReserva(0, { fornecedorTocado: true });
  });

  expect(result.current.errosReservas[0]?.fornecedorId).toBe("Escolha o fornecedor");
  expect(chamadas.some((c) => c.metodo === "POST")).toBe(false);
});

test("A02: taxa maior que o total gera erro em valorTaxas ao tentar salvar", async () => {
  const { result } = montar();
  await esperar.agencia(result);

  act(() => {
    result.current.adicionarReserva();
  });
  act(() => {
    result.current.atualizarReserva(0, { fornecedorId: "f1", valorTotal: 1000, valorTaxas: 2000 });
  });

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(result.current.errosReservas[0]?.valorTaxas).toBe("Taxas não podem passar do total");
});

test("A03: total preenchido com venda vazia bloqueia salvar com erro em valorCliente", async () => {
  const { result } = montar();
  await esperar.agencia(result);

  act(() => {
    result.current.adicionarReserva();
  });
  act(() => {
    result.current.atualizarReserva(0, { fornecedorId: "f1", valorTotal: 3000 });
  });

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(result.current.errosReservas[0]?.valorCliente).toBe("Informe quanto o cliente contratou (sugerido: total)");
});

test("A12: venda via operadora abaixo do custo bloqueia salvar com erro em valorCliente", async () => {
  const { result } = montar();
  await esperar.agencia(result);

  act(() => {
    result.current.adicionarReserva();
  });
  act(() => {
    result.current.atualizarReserva(0, {
      fornecedorId: "f1",
      valorTotal: 10000,
      valorCliente: 2000,
      ravClienteModo: "via_operadora",
    });
  });

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(result.current.errosReservas[0]?.valorCliente).toBe(
    "Com RAV via operadora a venda não pode ficar abaixo do custo",
  );
});
