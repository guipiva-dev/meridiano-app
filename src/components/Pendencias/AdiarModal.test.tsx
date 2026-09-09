import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PendenciaDto } from "@/api/pendencias";
import { AdiarModal } from "./AdiarModal";

const PENDENCIA: PendenciaDto = {
  id: "p1",
  versao: "111",
  titulo: "Renovar passaporte",
  descricao: null,
  dataPrevista: "2026-04-15",
  responsavelId: null,
  responsavelNome: null,
  clienteId: null,
  clienteNome: null,
  viagemId: "v1",
  codigoViagem: "VG-2026-0042",
  status: "aberta",
  origem: "automatica",
  prioridade: "normal",
  adiadaDe: null,
  concluidaEm: null,
  atrasada: false,
};

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidar = vi.spyOn(qc, "invalidateQueries");
  render(
    <QueryClientProvider client={qc}>
      <AdiarModal open pendencia={PENDENCIA} onClose={() => undefined} onAdiada={() => undefined} />
    </QueryClientProvider>,
  );
  return invalidar;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("409 avisa e recarrega a lista de pendências (senão a versão velha trava o retry)", async () => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(resposta(409, { codigo: "conflito", detail: "Alguém alterou este registro" })),
  );
  const invalidar = montar();

  fireEvent.change(screen.getByLabelText(/Nova data/), { target: { value: "2026-04-20" } });
  fireEvent.click(screen.getByRole("button", { name: "Adiar" }));

  expect(await screen.findByText(/Alguém alterou este registro/)).toBeInTheDocument();
  await waitFor(() => {
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["viagens", "v1", "pendencias"] });
  });
});

test("data anterior à prevista vira erro de campo e não chama a API", () => {
  const fetchSpy = vi.fn(() => Promise.resolve(resposta(200, {})));
  vi.stubGlobal("fetch", fetchSpy);
  montar();

  fireEvent.change(screen.getByLabelText(/Nova data/), { target: { value: "2026-04-10" } });
  fireEvent.click(screen.getByRole("button", { name: "Adiar" }));

  expect(screen.getByText("A nova data precisa ser depois de 15/04/2026")).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});
