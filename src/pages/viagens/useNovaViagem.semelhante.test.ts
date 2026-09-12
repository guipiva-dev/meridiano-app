import { act } from "@testing-library/react";
import { adiarRespostas, chamadas, montar, reiniciar } from "./useNovaViagem.harness";

beforeEach(reiniciar);

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("editar viagem existente: busca de semelhante envia excetoViagemId e ignora a própria viagem na resposta", async () => {
  vi.useFakeTimers();
  const semelhantes = adiarRespostas("/viagens/semelhantes");
  const { result } = montar("v9");
  await act(() => vi.advanceTimersByTimeAsync(500));
  expect(result.current.viagem).not.toBeNull();
  // A viagem carregada define o titular; o debounce da busca começa só então.
  await act(() => vi.advanceTimersByTimeAsync(500));

  const url = chamadas.find((c) => c.url.includes("/viagens/semelhantes"))?.url ?? "";
  expect(url).toContain("excetoViagemId=v9");

  await act(async () => {
    semelhantes[0]!([{ id: "v9", codigo: "VG-2026-0042" }]);
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(result.current.semelhante).toBeNull();
});
