import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { ClientesPage } from "./ClientesPage";

const LISTA = {
  itens: [
    {
      id: "c1",
      nome: "Carlos Mendes",
      cpfMascarado: "***.456.789-**",
      idade: 52,
      grupoNome: "Família Mendes",
      contato: "11998761234",
      pendenciasAbertas: 0,
      pendenciasUrgentes: 0,
      ultimaViagemDestino: "Lisboa",
      ultimaViagemData: "2026-04-12",
      ultimaViagemCancelada: false,
      viagens: 4,
    },
    {
      id: "c2",
      nome: "Lúcia Mendes",
      cpfMascarado: "***.654.321-**",
      idade: 49,
      grupoNome: "Família Mendes",
      contato: "11998765678",
      pendenciasAbertas: 1,
      pendenciasUrgentes: 1,
      ultimaViagemDestino: "Cancún",
      ultimaViagemData: "2026-02-03",
      ultimaViagemCancelada: true,
      viagens: 3,
    },
  ],
  total: 2,
  pagina: 1,
  tamanho: 25,
  contadores: { pessoas: 3, grupos: 2, passaportesVencendo: 1 },
};

const GRUPOS = {
  itens: [{ id: "g1", nome: "Família Mendes", tipo: "familia", cnpj: null, pessoas: 2, pessoasResumo: "", viagens: 3 }],
  total: 1,
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

function montar(entrada = "/clientes") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/clientes", element: <ClientesPage /> },
      { path: "/clientes/nova", element: <div>Nova pessoa</div> },
      { path: "/clientes/:id", element: <DetalheStub /> },
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
    if (url.includes("/clientes?")) return Promise.resolve(resposta(200, LISTA));
    if (url.includes("/grupos?")) return Promise.resolve(resposta(200, GRUPOS));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("cabeçalho mostra os contadores da agência", async () => {
  montar();
  expect(await screen.findByText("3 pessoas · 2 grupos · 1 passaportes vencendo")).toBeInTheDocument();
});

test("linha mostra CPF mascarado, idade e telefone formatado", async () => {
  montar();
  expect(await screen.findByText("Carlos Mendes")).toBeInTheDocument();
  expect(screen.getByText("***.456.789-**")).toBeInTheDocument();
  expect(screen.getByText(/52 anos/)).toBeInTheDocument();
  expect(screen.getByText("(11) 99876-1234")).toBeInTheDocument();
});

test("pendências urgentes viram badge e a última viagem cancelada some com o destino", async () => {
  montar();
  await screen.findByText("Lúcia Mendes");
  expect(screen.getByText("1 · urgente")).toBeInTheDocument();
  expect(screen.getByText("cancelada · fev/2026")).toBeInTheDocument();
  expect(screen.getByText("Lisboa · abr/2026")).toBeInTheDocument();
});

test("clicar na linha abre a pessoa", async () => {
  montar();
  fireEvent.click(await screen.findByText("Carlos Mendes"));
  expect(await screen.findByText("Detalhe c1")).toBeInTheDocument();
});

test("+ Nova pessoa navega para /clientes/nova", async () => {
  montar();
  await screen.findByText("Carlos Mendes");
  fireEvent.click(screen.getByRole("button", { name: /Nova pessoa/ }));
  expect(await screen.findByText("Nova pessoa")).toBeInTheDocument();
});
