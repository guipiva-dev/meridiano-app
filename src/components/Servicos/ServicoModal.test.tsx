import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ServicoModal } from "./ServicoModal";

const chamadas: { url: string; body: Record<string, unknown> }[] = [];

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
  render(
    <QueryClientProvider client={qc}>
      <ServicoModal open reservaId="r1" onClose={() => undefined} onSalvo={() => undefined} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({ url, body: JSON.parse(init?.body as string) as Record<string, unknown> });
    return Promise.resolve(resposta(201, {}));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("envia dataInicio no formato yyyy-MM-ddTHH:mm", async () => {
  montar();
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "GRU → LIS" } });
  fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-04-18T22:30" } });

  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

  await waitFor(() => {
    expect(chamadas[0]?.url).toBe("/api/v1/reservas/r1/servicos");
  });
  expect(chamadas[0]?.body.dataInicio).toBe("2026-04-18T22:30");
  expect(chamadas[0]?.body.dataFim).toBeNull();
});

test("sem título mostra erro de campo e não chama a API", async () => {
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

  expect(await screen.findByText("Informe o título do serviço")).toBeInTheDocument();
  expect(chamadas).toEqual([]);
});
