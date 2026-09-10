import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { FornecedorPage } from "./FornecedorPage";

const DETALHE = {
  id: "f1",
  versao: "77",
  nome: "CVC",
  tipo: "operadora",
  cnpj: "12345678000199",
  site: "cvc.com.br",
  contato: "Ana Paula",
  telefone: "1133334444",
  telefoneEmergencia: "11999998888",
  percentualComissaoPadrao: 10,
  prazoComissaoDias: 30,
  ativo: true,
  observacoes: null,
  resumo: { reservas: 12 },
  regras: [
    { vigenteDesde: "2025-01-01", janelas: [{ diaInicial: 1, diaFinal: 31, diaPagamento: 10, mesesAFrente: 1 }] },
    {
      vigenteDesde: "2026-01-01",
      janelas: [
        { diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 },
        { diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 },
      ],
    },
  ],
  regraVigente: {
    vigenteDesde: "2026-01-01",
    janelas: [
      { diaInicial: 1, diaFinal: 14, diaPagamento: 20, mesesAFrente: 0 },
      { diaInicial: 15, diaFinal: 31, diaPagamento: 5, mesesAFrente: 1 },
    ],
  },
};

const chamadas: { metodo: string; url: string; body: unknown }[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const auth: AuthValue = {
  me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

function montar(entrada = "/fornecedores/f1") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/fornecedores/nova", element: <FornecedorPage /> },
      { path: "/fornecedores/:id", element: <FornecedorPage /> },
    ],
    { initialEntries: [entrada] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      metodo: init?.method ?? "GET",
      url,
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    if (url.includes("/reservas")) {
      return Promise.resolve(resposta(200, { itens: [], total: 0, pagina: 1, tamanho: 25 }));
    }
    return Promise.resolve(resposta(200, DETALHE));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("mostra as três abas e o resumo do fornecedor", async () => {
  montar();
  expect(await screen.findByRole("heading", { name: /CVC/ })).toBeInTheDocument();
  expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Dados", "Financeiro", "Reservas12"]);
  expect(screen.getByText("Operadora · 12 reservas · comissão padrão 10 %")).toBeInTheDocument();
});

test("Ctrl+S manda PUT com a versão carregada", async () => {
  montar();
  await screen.findByDisplayValue("CVC");

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(chamadas.some((c) => c.metodo === "PUT")).toBe(true);
  });
  const put = chamadas.find((c) => c.metodo === "PUT");
  expect(put?.url).toBe("/api/v1/fornecedores/f1");
  expect(put?.body).toMatchObject({ nome: "CVC", tipo: "operadora", ativo: true, versao: "77" });
});

test("aba Financeiro mostra a regra vigente", async () => {
  montar();
  fireEvent.click(await screen.findByRole("tab", { name: "Financeiro" }));
  expect(await screen.findByText("Regra vigente desde 01/01/2026")).toBeInTheDocument();
});
