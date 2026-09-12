import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DocumentoDto } from "@/api/clientes";
import { DocumentosPessoa } from "./DocumentosPessoa";

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
  {
    id: "d2",
    versao: "1",
    clienteId: "c1",
    tipo: "rg",
    numero: "12.345.678-9",
    emissao: null,
    validade: null,
    paisEmissor: null,
    diasParaVencer: null,
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

function montar(verDocumento = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <DocumentosPessoa clienteId="c1" verDocumento={verDocumento} podeEditar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/anexos")) return Promise.resolve(resposta(200, []));
    return Promise.resolve(resposta(200, DOCS));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("lista os documentos com número e badge de validade", async () => {
  montar();
  expect(await screen.findByText("FX123456")).toBeInTheDocument();
  expect(screen.getByText("Passaporte")).toBeInTheDocument();
  expect(screen.getByText("32 dias")).toBeInTheDocument();
  expect(screen.getByText("12.345.678-9")).toBeInTheDocument();
});

test("sem permissão de ver documento o número fica mascarado", async () => {
  montar(false);
  expect(await screen.findByText("Passaporte")).toBeInTheDocument();
  expect(screen.queryByText("FX123456")).toBeNull();
  expect(screen.getAllByText("•••••")).toHaveLength(2);
});

test('"+ Documento" abre o modal', async () => {
  montar();
  await screen.findByText("FX123456");

  fireEvent.click(screen.getByRole("button", { name: "+ Documento" }));

  expect(await screen.findByRole("dialog", { name: "Novo documento" })).toBeInTheDocument();
});

test('clicar "+ Documento" não grava nada: só o Salvar chama a API', async () => {
  const mutacoes: string[] = [];
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method !== "GET") mutacoes.push(`${method} ${url}`);
    if (url.includes("/anexos")) return Promise.resolve(resposta(200, []));
    if (method === "POST") return Promise.resolve(resposta(201, {}));
    return Promise.resolve(resposta(200, DOCS));
  });
  montar();
  await screen.findByText("FX123456");

  const botao = screen.getByRole("button", { name: "+ Documento" });
  fireEvent.keyDown(botao, { key: "Enter" });
  fireEvent.click(botao);
  fireEvent.keyUp(botao, { key: "Enter" });
  await screen.findByRole("dialog", { name: "Novo documento" });
  await new Promise((r) => setTimeout(r, 20));
  expect(mutacoes).toEqual([]);

  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => {
    expect(mutacoes).toEqual(["POST /api/v1/clientes/c1/documentos"]);
  });
});
