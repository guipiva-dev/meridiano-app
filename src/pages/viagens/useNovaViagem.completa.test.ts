import { act } from "@testing-library/react";
import { chamadas, esperar, montar, reiniciar } from "./useNovaViagem.harness";

beforeEach(reiniciar);
afterEach(() => {
  vi.unstubAllGlobals();
});

function preencherCabecalho(result: ReturnType<typeof montar>["result"]) {
  act(() => {
    result.current.form.setValue("destino", "Lisboa");
    result.current.form.setValue("passageiros", [{ clienteId: "c1", nome: "Carlos", titular: true }]);
  });
}

test("salvar sem ida, volta e reserva não chama a API e aponta os três erros", async () => {
  const { result } = montar();
  await esperar.agencia(result);
  preencherCabecalho(result);

  let ok = true;
  await act(async () => {
    ok = await result.current.salvar();
  });

  expect(ok).toBe(false);
  expect(result.current.erros.dataIda).toBe("Informe a data de ida");
  expect(result.current.erros.dataVolta).toBe("Informe a data de volta");
  expect(result.current.erros.reservas).toBe("Adicione ao menos uma reserva");
  expect(result.current.totalErros).toBe(3);
  expect(chamadas.some((c) => c.metodo === "POST")).toBe(false);
});

test("volta antes da ida continua com a mensagem própria", async () => {
  const { result } = montar();
  await esperar.agencia(result);
  preencherCabecalho(result);
  act(() => {
    result.current.form.setValue("dataIda", "2026-05-10");
    result.current.form.setValue("dataVolta", "2026-05-01");
  });

  await act(async () => {
    await result.current.salvar();
  });

  expect(result.current.erros.dataVolta).toBe("Volta antes da ida");
});

test("erro de reserva some ao adicionar a primeira reserva", async () => {
  const { result } = montar();
  await esperar.agencia(result);
  preencherCabecalho(result);
  await act(async () => {
    await result.current.salvar();
  });
  expect(result.current.erros.reservas).toBeDefined();

  act(() => {
    result.current.adicionarReserva();
  });

  expect(result.current.erros.reservas).toBeUndefined();
});

test("reserva cancelada conta como reserva para salvar", async () => {
  const { result } = montar("v9");
  await esperar.viagem(result);
  act(() => {
    const [r] = result.current.form.getValues("reservas");
    result.current.form.setValue("reservas", [{ ...r!, status: "cancelada" }]);
    result.current.form.setValue("dataVolta", "2026-04-28");
  });

  await act(async () => {
    await result.current.salvar();
  });

  expect(result.current.erros.reservas).toBeUndefined();
  expect(chamadas.some((c) => c.metodo === "PUT")).toBe(true);
});

test("expandir/recolher reserva não marca alterações não salvas", async () => {
  const { result } = montar("v9");
  await esperar.viagem(result);

  act(() => {
    result.current.alternarReserva(0);
  });

  expect(result.current.form.getValues("reservas")[0]?.aberta).toBe(true);
  expect(result.current.form.formState.isDirty).toBe(false);
  expect(result.current.salvamento.estado).not.toBe("dirty");
});
