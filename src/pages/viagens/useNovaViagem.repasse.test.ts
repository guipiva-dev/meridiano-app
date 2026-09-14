import { act, waitFor } from "@testing-library/react";
import { chamadas, esperar, montar, reiniciar, stubs, viagemDto } from "./useNovaViagem.harness";

beforeEach(reiniciar);

test("F1: venda ao cliente nula conta como o total (RAV 0) na base do vendedor", async () => {
  const { result } = montar();
  await esperar.agencia(result);
  await waitFor(() => {
    expect(result.current.vendedorSelecionado?.geraRepasse).toBe(true);
  });
  act(() => {
    result.current.adicionarReserva();
    result.current.atualizarReserva(0, { fornecedorId: "f1", valorTotal: 3000, valorCliente: null });
  });
  // comissão sugerida 10 % de 3000 = 300; RAV 0 → base 300; sugestão 20 % = 60
  expect(result.current.baseRepasse).toBe(300);
  expect(result.current.repasseSugerido).toBe(60);

  act(() => {
    result.current.atualizarReserva(0, { valorCliente: 3200 });
  });
  expect(result.current.baseRepasse).toBe(500);
  expect(result.current.repasseSugerido).toBe(100);
});

async function comReservaDeComissao() {
  const r = montar();
  await esperar.agencia(r.result);
  await waitFor(() => {
    expect(r.result.current.vendedorSelecionado?.geraRepasse).toBe(true);
  });
  act(() => {
    r.result.current.adicionarReserva();
    r.result.current.atualizarReserva(0, {
      fornecedorId: "f1",
      valorTotal: 10000,
      valorCliente: 10500,
      valorComissao: 1000,
      taxaServico: 150,
    });
  });
  return r;
}

test("% do vendedor calcula o valor sobre a comissão total (sem taxa de serviço)", async () => {
  const { result } = await comReservaDeComissao();
  act(() => {
    result.current.definirRepassePercentual(10);
  });
  expect(result.current.baseRepasse).toBe(1500);
  expect(result.current.form.getValues("repassePercentual")).toBe(10);
  expect(result.current.form.getValues("repasseValor")).toBe(150);
  expect(result.current.repasseValorMostrado).toBe(150);
});

test("digitar R$ do vendedor limpa o %", async () => {
  const { result } = await comReservaDeComissao();
  act(() => {
    result.current.definirRepassePercentual(10);
  });
  act(() => {
    result.current.definirRepasseValor(99);
  });
  expect(result.current.form.getValues("repassePercentual")).toBeNull();
  expect(result.current.repasseValorMostrado).toBe(99);
});

test("sugestão usa o % padrão do vendedor sobre a comissão total", async () => {
  const { result } = await comReservaDeComissao();
  // harness: percentualPadrao 20 → 20 % de 1500
  expect(result.current.repasseSugerido).toBe(300);
});

test("base do vendedor conta reserva cancelada com comissão mantida (como o backend)", async () => {
  const { result } = await comReservaDeComissao();
  act(() => {
    result.current.adicionarReserva();
    result.current.atualizarReserva(1, {
      fornecedorId: "f1",
      valorTotal: 2000,
      valorCliente: 2100,
      valorComissao: 200,
      status: "cancelada",
      comissaoMantida: true,
    });
    result.current.adicionarReserva();
    result.current.atualizarReserva(2, {
      fornecedorId: "f1",
      valorTotal: 900,
      valorCliente: 900,
      valorComissao: 90,
      status: "cancelada",
      comissaoMantida: false,
    });
  });
  // 1500 (ativa) + 300 (cancelada com comissão mantida); a cancelada sem comissão fica fora
  expect(result.current.baseRepasse).toBe(1800);
});

test("repasse pago mostra o valor gravado, sem recalcular pelo %", async () => {
  stubs.respostaGetViagem = () => ({
    ...viagemDto("7"),
    repasse: { id: "rp1", valor: 123, percentual: 10, status: "pago" },
  });
  const { result } = montar("v9");
  await esperar.viagem(result);
  expect(result.current.form.getValues("repassePercentual")).toBe(10);
  expect(result.current.repasseValorMostrado).toBe(123);
});

test("base do vendedor negativa vira 0 (como o greatest do backend)", async () => {
  const { result } = await comReservaDeComissao();
  act(() => {
    // RAV 8000 − 10000 = −2000; base 1000 − 2000 = −1000
    result.current.atualizarReserva(0, { valorCliente: 8000 });
  });
  act(() => {
    result.current.definirRepassePercentual(10);
  });
  expect(result.current.baseRepasse).toBe(0);
  expect(result.current.repasseValorMostrado).toBe(0);
});

test("vendedor que não gera repasse: request vai sem % e sem R$ do vendedor", async () => {
  const { result } = await comReservaDeComissao();
  act(() => {
    result.current.definirRepassePercentual(10);
    result.current.form.setValue("destino", "Lisboa");
    result.current.form.setValue("passageiros", [{ clienteId: "c1", nome: "Carlos", titular: true }]);
    result.current.form.setValue("vendedorId", "u2");
  });
  await act(async () => {
    await result.current.salvar();
  });
  const corpo = chamadas.find((c) => c.metodo === "POST")?.corpo as Record<string, unknown>;
  expect(corpo.vendedorId).toBe("u2");
  expect(corpo.repassePercentual).toBeNull();
  expect(corpo.repasseValor).toBeNull();
});

test("limpar o % mantém o valor mostrado em R$", async () => {
  const { result } = await comReservaDeComissao();
  act(() => {
    result.current.definirRepassePercentual(10);
  });
  act(() => {
    result.current.definirRepassePercentual(null);
  });
  expect(result.current.form.getValues("repassePercentual")).toBeNull();
  expect(result.current.form.getValues("repasseValor")).toBe(150);
  expect(result.current.repasseValorMostrado).toBe(150);
});
