import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnexoDto } from "@/api/anexos";
import type { ReservaDto } from "@/api/viagens";
import { ListaAnexos } from "./ListaAnexos";

const RESERVAS = [{ id: "r1", fornecedorNome: "CVC Operadora" }] as unknown as ReservaDto[];

const ANEXOS: AnexoDto[] = [
  {
    id: "a1",
    vinculo: "reserva",
    clienteId: null,
    viagemId: null,
    reservaId: "r1",
    tipo: "voucher",
    nomeArquivo: "voucher-cvc-K7X2PQ.pdf",
    mimeType: "application/pdf",
    tamanhoBytes: 217_088,
    sensivel: false,
    dataDescarte: null,
    enviadoPorNome: null,
    criadoEm: "2026-04-01T10:00:00Z",
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
      <ListaAnexos viagemId="v1" reservas={RESERVAS} podeEnviar />
    </QueryClientProvider>,
  );
}

function montarPessoa() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ListaAnexos clienteId="c1" podeEnviar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  urls.length = 0;
  vi.stubGlobal("fetch", (url: string) => {
    urls.push(url);
    if (url.includes("/download")) return Promise.resolve(resposta(200, { url: "https://r2/anexo.pdf" }));
    return Promise.resolve(resposta(200, ANEXOS));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("mostra o anexo com vínculo e tamanho", async () => {
  montar();
  expect(await screen.findByText("voucher-cvc-K7X2PQ.pdf")).toBeInTheDocument();
  expect(screen.getByText("reserva 1 · 212 KB")).toBeInTheDocument();
});

test('"Abrir" pede a URL e abre em nova aba', async () => {
  const abrir = vi.spyOn(window, "open").mockReturnValue(null);
  montar();
  await screen.findByText("voucher-cvc-K7X2PQ.pdf");

  fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

  await waitFor(() => {
    expect(urls.some((u) => u.includes("/anexos/a1/download"))).toBe(true);
    expect(abrir).toHaveBeenCalledWith("https://r2/anexo.pdf", "_blank", "noopener");
  });
});

test("escopo pessoa busca os anexos do cliente", async () => {
  montarPessoa();
  await screen.findByText("voucher-cvc-K7X2PQ.pdf");
  expect(urls[0]).toContain("/clientes/c1/anexos");
});
