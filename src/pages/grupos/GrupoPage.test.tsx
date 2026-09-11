import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { GrupoPage } from "./GrupoPage";

const GRUPO = {
  id: "g1",
  versao: "3",
  nome: "Turismo XYZ",
  tipo: "empresa",
  cnpj: "12345678000199",
  observacoes: null,
  pessoas: [
    { id: "c1", nome: "Carlos", idade: 30 },
    { id: "c2", nome: "Lúcia", idade: 15 },
  ],
  viagens: 2,
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

/** Perfil só com `cliente.ver` (ex.: a rota exige só isso, mas editar/vincular/remover exigem `cliente.editar`). */
const authSemEditar: AuthValue = { ...auth, pode: (p: string) => p !== "cliente.editar" };

interface Chamada {
  method: string;
  url: string;
  body?: unknown;
}
const chamadas: Chamada[] = [];

function montar(entrada = "/clientes/grupos/g1", authValue: AuthValue = auth) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/clientes/grupos", element: <div>Lista de grupos</div> },
      { path: "/clientes/grupos/:id", element: <GrupoPage /> },
    ],
    { initialEntries: [entrada] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={authValue}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(init.body as string) as unknown) : undefined;
    chamadas.push({ method, url, body });
    if (url === "/api/v1/grupos/g1" && method === "GET") return Promise.resolve(resposta(200, GRUPO));
    if (url === "/api/v1/grupos/g1" && method === "PUT") {
      return Promise.resolve(resposta(200, { ...GRUPO, ...(body as object), versao: "4" }));
    }
    if (url.startsWith("/api/v1/clientes/busca")) {
      return Promise.resolve(resposta(200, [{ id: "c3", nome: "Bia Nova", telefone: null }]));
    }
    if (url === "/api/v1/grupos/g1/pessoas" && method === "POST") return Promise.resolve(resposta(200, GRUPO));
    if (url === "/api/v1/grupos/g1/pessoas/c2" && method === "DELETE") return Promise.resolve(resposta(204, null));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("grupo empresa mostra CNPJ habilitado e formatado", async () => {
  montar();
  const cnpj = await screen.findByDisplayValue("12.345.678/0001-99");
  expect(cnpj).not.toBeDisabled();
});

test("trocar tipo para família desabilita o CNPJ", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "familia" } });
  expect(screen.getByDisplayValue("12.345.678/0001-99")).toBeDisabled();
});

test("Ctrl+S salva com a versão atual", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "PUT" && c.url === "/api/v1/grupos/g1")).toBe(true);
  });
  const put = chamadas.find((c) => c.method === "PUT" && c.url === "/api/v1/grupos/g1");
  expect(put?.body).toMatchObject({ versao: "3" });
});

test("Remover confirma e chama DELETE", async () => {
  montar();
  await screen.findByText("Lúcia");
  const [, removerLucia] = screen.getAllByRole("button", { name: "Remover" });
  fireEvent.click(removerLucia!);

  const dialogo = await screen.findByRole("dialog");
  fireEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "DELETE" && c.url === "/api/v1/grupos/g1/pessoas/c2")).toBe(true);
  });
});

test("+ Vincular pessoa busca e chama POST", async () => {
  montar();
  await screen.findByText("Lúcia");

  vi.useFakeTimers();
  fireEvent.change(screen.getByLabelText("Buscar pessoa para vincular"), { target: { value: "Bia" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  vi.useRealTimers();

  fireEvent.mouseDown(screen.getByText("Bia Nova"));

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "POST" && c.url === "/api/v1/grupos/g1/pessoas")).toBe(true);
  });
  const post = chamadas.find((c) => c.method === "POST" && c.url === "/api/v1/grupos/g1/pessoas");
  expect(post?.body).toMatchObject({ clienteId: "c3" });
});

test("Fechar navega para /clientes/grupos (rota fixa, não histórico)", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");

  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

  expect(await screen.findByText("Lista de grupos")).toBeInTheDocument();
});

test("sem cliente.editar: não mostra Salvar, Remover nem Vincular; Ctrl+S não salva; Fechar continua liberado", async () => {
  montar("/clientes/grupos/g1", authSemEditar);
  await screen.findByDisplayValue("12.345.678/0001-99");

  expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Remover" })).toBeNull();
  expect(screen.queryByLabelText("Buscar pessoa para vincular")).toBeNull();
  expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });
  expect(chamadas.some((c) => c.method === "PUT")).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(await screen.findByText("Lista de grupos")).toBeInTheDocument();
});
