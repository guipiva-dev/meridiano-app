import { act } from "@testing-library/react";
import { chamadas, esperar, montar, reiniciar, stubs } from "./useNovaViagem.harness";

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

// Review round 1: taxa_maior_que_total/esperado_negativo não têm índice de reserva no 422 (igual ao
// cancelamento em lote) — não podem apontar pra um campo de reserva certo, então caem no Alert de bloco.
test("422 esperado_negativo (sem índice de reserva) vira Alert de bloco, não é engolido", async () => {
  stubs.respostaPost = {
    status: 422,
    body: { codigo: "esperado_negativo", detail: "Esperado da operadora ficaria negativo" },
  };
  const { result } = montar();
  await esperar.agencia(result);

  act(() => {
    result.current.form.setValue("destino", "Lisboa");
    result.current.form.setValue("passageiros", [{ clienteId: "c1", nome: "Carlos", titular: true }]);
  });

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(result.current.erroBloco).toBe("Esperado da operadora ficaria negativo");
  expect(result.current.erros.valorCliente).toBeUndefined();
});
