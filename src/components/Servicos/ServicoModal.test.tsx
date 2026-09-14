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

function montar(viagem: { dataIda?: string | null; dataVolta?: string | null } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ServicoModal open reservaId="r1" onClose={() => undefined} onSalvo={() => undefined} {...viagem} />
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
  fireEvent.change(screen.getByLabelText("Saída"), { target: { value: "2026-04-18T22:30" } });

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

test("data do serviço fora da viagem mostra aviso perto das datas e não bloqueia o envio", async () => {
  montar({ dataIda: "2026-10-01", dataVolta: "2026-10-15" });
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "hospedagem" } });
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Hotel" } });
  fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: "2026-10-10T14:00" } });
  expect(screen.queryByText(/depois da volta/)).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: "2026-10-16T12:00" } });
  expect(screen.getByText("Check-out 16/10 é depois da volta da viagem (15/10)")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
  await waitFor(() => {
    expect(chamadas[0]?.body.dataFim).toBe("2026-10-16T12:00");
  });
});

test("rótulos das datas acompanham o tipo do serviço", () => {
  montar();
  expect(screen.getByLabelText("Saída")).toBeInTheDocument();
  expect(screen.getByLabelText("Chegada")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "hospedagem" } });
  expect(screen.getByLabelText("Check-in")).toBeInTheDocument();
  expect(screen.getByLabelText("Check-out")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "seguro" } });
  expect(screen.getByLabelText("Início")).toBeInTheDocument();
  expect(screen.getByLabelText("Fim")).toBeInTheDocument();
});
