import { act } from "@testing-library/react";
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
