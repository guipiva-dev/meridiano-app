import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { GruposPage } from "./GruposPage";

const LISTA = {
  itens: [
    {
      id: "g1",
      nome: "Família Mendes",
      tipo: "familia",
      cnpj: null,
      pessoas: 2,
      pessoasResumo: "Carlos, Lúcia",
      viagens: 3,
    },
    {
      id: "g2",
      nome: "Turismo XYZ",
      tipo: "empresa",
      cnpj: "12345678000199",
      pessoas: 5,
      pessoasResumo: "Ana, Bia, +3",
      viagens: 8,
    },
  ],
  total: 2,
  pagina: 1,
  tamanho: 25,
};

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

function DetalheStub() {
  const { id } = useParams();
  return <div>Detalhe {id}</div>;
}

function montar(entrada = "/clientes/grupos") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/clientes/grupos", element: <GruposPage /> },
      { path: "/clientes/grupos/:id", element: <DetalheStub /> },
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
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/grupos?")) return Promise.resolve(resposta(200, LISTA));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("tabela mostra os grupos com o resumo de pessoas", async () => {
  montar();
  expect(await screen.findByText("Família Mendes")).toBeInTheDocument();
  expect(screen.getByText("Carlos, Lúcia")).toBeInTheDocument();
  expect(screen.getByText("Turismo XYZ")).toBeInTheDocument();
});

test("clicar na linha navega para /clientes/grupos/<id>", async () => {
  montar();
  fireEvent.click(await screen.findByText("Família Mendes"));
  expect(await screen.findByText("Detalhe g1")).toBeInTheDocument();
});
