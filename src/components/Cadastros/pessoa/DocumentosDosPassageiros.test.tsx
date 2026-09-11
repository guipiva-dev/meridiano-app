import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { DocumentoDto } from "@/api/clientes";
import type { PassageiroDto } from "@/api/viagens";
import { DocumentosDosPassageiros } from "./DocumentosDosPassageiros";

const PASSAGEIROS: PassageiroDto[] = [
  { clienteId: "c1", nome: "Carlos Mendes", titular: true },
  { clienteId: "c2", nome: "Lúcia Mendes", titular: false },
];

const DOCS: DocumentoDto[] = [
  {
    id: "d1",
    versao: "1",
    clienteId: "c1",
    tipo: "passaporte",
    numero: "FX123456",
    emissao: "2018-05-10",
    validade: "2026-05-22",
    paisEmissor: "Brasil",
    diasParaVencer: 32,
  },
];

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
      <MemoryRouter>
        <DocumentosDosPassageiros passageiros={PASSAGEIROS} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("uma linha por documento e aviso para quem não tem nenhum", async () => {
  vi.stubGlobal("fetch", (url: string) => Promise.resolve(resposta(200, url.includes("/clientes/c1/") ? DOCS : [])));
  montar();

  const linha = await screen.findByText(/Carlos Mendes · Passaporte/);
  // Uma linha só: nome, tipo, número e validade no mesmo elemento.
  expect(linha).toHaveTextContent("Carlos Mendes · Passaporte · FX123456 · validade 22/05/2026");
  expect(screen.getByText("32 dias")).toBeInTheDocument();
  expect(screen.getByText("Lúcia Mendes · Sem documentos cadastrados")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "Abrir cadastro" })).toHaveLength(2);
});

test("falha de leitura mostra erro, nunca 'Sem documentos cadastrados'", async () => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(resposta(500, { codigo: "erro", detail: "Falha ao consultar documentos" })),
  );
  montar();

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Tentar de novo" })).toHaveLength(2);
  });
  expect(screen.getAllByText(/Falha ao consultar documentos/)).toHaveLength(2);
  expect(screen.queryByText(/Sem documentos cadastrados/)).toBeNull();
});
