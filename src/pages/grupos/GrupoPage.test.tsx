import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      { path: "/clientes/grupos/nova", element: <GrupoPage /> },
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

test("novo grupo: sair do campo Nome vazio (blur) mostra erro local", async () => {
  const user = userEvent.setup();
  montar("/clientes/grupos/nova");

  await user.click(await screen.findByLabelText(/^Nome/));
  await user.tab();

  expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
});

test("empresa com CNPJ inválido mostra erro local sem precisar salvar", async () => {
  const user = userEvent.setup();
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");

  const cnpj = screen.getByLabelText("CNPJ");
  await user.clear(cnpj);
  await user.type(cnpj, "12.345.678/0001-00");

  expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
});

test("sem cliente.editar: não mostra Salvar, Remover nem Vincular; Ctrl+S não salva; Fechar continua liberado", async () => {
  montar("/clientes/grupos/g1", authSemEditar);
  await screen.findByDisplayValue("12.345.678/0001-99");

  expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Remover" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Excluir grupo" })).toBeNull();
  expect(screen.queryByLabelText("Buscar pessoa para vincular")).toBeNull();
  expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });
  expect(chamadas.some((c) => c.method === "PUT")).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  expect(await screen.findByText("Lista de grupos")).toBeInTheDocument();
});

test("nome tem maxLength 150", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");
  expect(screen.getByLabelText(/^Nome/)).toHaveAttribute("maxLength", "150");
});

test("observações mostra contador N/2000 e limita maxLength", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");
  const observacoes = screen.getByLabelText("Observações");
  expect(observacoes).toHaveAttribute("maxLength", "2000");

  fireEvent.change(observacoes, { target: { value: "abc" } });

  expect(screen.getByText("3/2000")).toBeInTheDocument();
});

test("Excluir grupo confirma, chama DELETE e volta para a lista", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");

  fireEvent.click(screen.getByRole("button", { name: "Excluir grupo" }));
  const dialogo = await screen.findByRole("dialog");
  expect(chamadas.some((c) => c.method === "DELETE" && c.url === "/api/v1/grupos/g1")).toBe(false);

  fireEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "DELETE" && c.url === "/api/v1/grupos/g1")).toBe(true);
  });
  expect(await screen.findByText("Lista de grupos")).toBeInTheDocument();
});

test("Excluir grupo com falha fecha o diálogo (Alert não fica atrás do overlay)", async () => {
  montar();
  await screen.findByDisplayValue("12.345.678/0001-99");

  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    chamadas.push({ method, url });
    if (url === "/api/v1/grupos/g1" && method === "DELETE") {
      return Promise.resolve(resposta(500, { codigo: "erro", detail: "Falha ao excluir" }));
    }
    if (url === "/api/v1/grupos/g1") return Promise.resolve(resposta(200, GRUPO));
    return Promise.resolve(resposta(200, null));
  });

  fireEvent.click(screen.getByRole("button", { name: "Excluir grupo" }));
  const dialogo = await screen.findByRole("dialog");
  fireEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));

  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  expect(await screen.findByText("Falha ao excluir")).toBeInTheDocument();
});
