import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AtendimentoDto } from "@/api/clientes";
import { AtendimentosPessoa } from "./AtendimentosPessoa";

const ITENS: AtendimentoDto[] = [
  {
    id: "a1",
    versao: "1",
    canal: "whatsapp",
    resumo: "Enviou fotos do hotel",
    ocorridoEm: "2026-04-18T10:00:00Z",
    usuarioId: "u1",
    usuarioNome: "Guilherme",
  },
  {
    id: "a2",
    versao: "1",
    canal: "ligacao",
    resumo: "Confirmou o embarque",
    ocorridoEm: "2025-11-03T08:00:00Z",
    usuarioId: "u1",
    usuarioNome: "Guilherme",
  },
];

const urls: string[] = [];

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
      <AtendimentosPessoa clienteId="c1" podeEditar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  urls.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-04-20T12:00:00Z"));
  vi.stubGlobal("fetch", (url: string) => {
    urls.push(url);
    return Promise.resolve(resposta(200, ITENS));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("agrupa os atendimentos por mês e por ano anterior", async () => {
  montar();
  expect(await screen.findByText("Enviou fotos do hotel")).toBeInTheDocument();
  expect(screen.getByText("Abril de 2026")).toBeInTheDocument();
  expect(screen.getByText("2025")).toBeInTheDocument();
  expect(screen.getByText("2 registros · agrupados por mês")).toBeInTheDocument();
});

test("filtrar por canal refaz a query com ?canal=ligacao", async () => {
  montar();
  await screen.findByText("Enviou fotos do hotel");

  fireEvent.change(screen.getByLabelText("Canal"), { target: { value: "ligacao" } });

  await waitFor(() => {
    expect(urls.some((u) => u.includes("/clientes/c1/atendimentos?canal=ligacao"))).toBe(true);
  });
});
