import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { NovaViagemPage } from "./NovaViagemPage";

const FORNECEDORES = [
  { id: "f1", nome: "CVC", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];
const VENDEDORES = [{ id: "u1", nome: "Ana", perfil: "dono", geraRepasse: false, percentualPadrao: 0 }];
const AGENCIA = { nome: "Viva", taxaServicoPadrao: 50 };

const urls: string[] = [];

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

function montar(entrada = "/viagens/nova") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/viagens/nova", element: <NovaViagemPage /> },
      { path: "/viagens/:id/editar", element: <NovaViagemPage /> },
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
  urls.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    urls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (/\/viagens\/[^/?]+$/.test(url)) {
      return Promise.resolve(resposta(500, { codigo: "erro", detail: "Falha ao carregar a viagem" }));
    }
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renderiza o cabeçalho, a seção de dados e o botão de adicionar reserva", async () => {
  montar();
  expect(await screen.findByRole("heading", { name: /Nova viagem/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Dados da viagem" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+ Adicionar reserva" })).toBeInTheDocument();
});

test("Ctrl+Enter adiciona um card de reserva", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });
  expect(screen.queryByRole("region", { name: /Reserva 1/ })).toBeNull();

  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });

  expect(await screen.findByRole("region", { name: /Reserva 1/ })).toBeInTheDocument();
});

test("Ctrl+S sem passageiros mostra erro no campo Passageiros e não chama a API", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(screen.getByText("Adicione ao menos um passageiro")).toBeInTheDocument();
  });
  expect(urls.some((u) => u.startsWith("POST"))).toBe(false);
});

test("falha ao carregar a viagem mostra o erro no topo e sai do esqueleto", async () => {
  montar("/viagens/v9/editar");
  expect(await screen.findByText("Falha ao carregar a viagem")).toBeInTheDocument();
  expect(screen.queryByLabelText("Carregando")).toBeNull();
  expect(screen.getByRole("heading", { name: /Nova viagem/ })).toBeInTheDocument();
});
