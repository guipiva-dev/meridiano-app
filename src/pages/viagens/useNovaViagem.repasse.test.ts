import { act, waitFor } from "@testing-library/react";
import { esperar, montar, reiniciar } from "./useNovaViagem.harness";

beforeEach(reiniciar);

test("F1: repasseSugerido fica null sem venda ao cliente e vira número ao preencher", async () => {
  const { result } = montar();
  await esperar.agencia(result);
  act(() => {
    result.current.adicionarReserva();
    result.current.atualizarReserva(0, { fornecedorId: "f1", valorTotal: 3000, valorCliente: null });
  });
  expect(result.current.repasseSugerido).toBeNull();

  act(() => {
    result.current.atualizarReserva(0, { valorCliente: 3200 });
  });
  expect(typeof result.current.repasseSugerido).toBe("number");
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
