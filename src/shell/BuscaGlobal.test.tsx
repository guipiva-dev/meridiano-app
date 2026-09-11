import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { BuscaGlobal } from "./BuscaGlobal";

const auth: AuthValue = {
  me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

const urls: string[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const BUSCA_CARL = {
  clientes: [{ id: "c1", nome: "Carla Souza", telefone: "11999990000" }],
  viagens: [],
  reservas: [],
};

const BUSCA_VIAGEM = {
  clientes: [],
  viagens: [
    { id: "v1", codigo: "V-001", destino: "Roma", titular: "João", dataIda: null, faseOperacional: "em_emissao" },
  ],
  reservas: [],
};

let router: ReturnType<typeof createMemoryRouter>;

function montar() {
  router = createMemoryRouter(
    [
      { path: "/", element: <BuscaGlobal /> },
      { path: "/clientes/:id", element: <p>cliente</p> },
      { path: "/viagens/:id", element: <p>viagem</p> },
    ],
    { initialEntries: ["/"] },
  );
  return render(
    <AuthContext.Provider value={auth}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  urls.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("q com 1 caractere não chama a API", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    urls.push(url);
    return Promise.resolve(resposta(200, BUSCA_CARL));
  });
  const user = userEvent.setup({ delay: null });
  montar();
  await user.type(screen.getByRole("combobox", { name: "Buscar" }), "c");
  await act(() => vi.advanceTimersByTimeAsync(300));
  expect(urls).toHaveLength(0);
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("digitar 'carl' chama /busca?q=carl após o debounce e mostra Clientes com 1 item", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    urls.push(url);
    return Promise.resolve(resposta(200, BUSCA_CARL));
  });
  const user = userEvent.setup({ delay: null });
  montar();
  await user.type(screen.getByRole("combobox", { name: "Buscar" }), "carl");
  await act(() => vi.advanceTimersByTimeAsync(300));
  await waitFor(() => {
    expect(urls).toEqual(["/api/v1/busca?q=carl"]);
  });
  expect(await screen.findByRole("group", { name: "Clientes" })).toBeInTheDocument();
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(screen.getByText("Carla Souza")).toBeInTheDocument();
});

test("ArrowDown + Enter navega para /viagens/<id> quando o primeiro item é viagem", async () => {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, BUSCA_VIAGEM)));
  const user = userEvent.setup({ delay: null });
  montar();
  const input = screen.getByRole("combobox", { name: "Buscar" });
  await user.type(input, "roma");
  await act(() => vi.advanceTimersByTimeAsync(300));
  await screen.findByRole("option");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(router.state.location.pathname).toBe("/viagens/v1");
  expect(input).toHaveValue("");
});

test("Esc fecha o popover", async () => {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, BUSCA_CARL)));
  const user = userEvent.setup({ delay: null });
  montar();
  await user.type(screen.getByRole("combobox", { name: "Buscar" }), "carl");
  await act(() => vi.advanceTimersByTimeAsync(300));
  await screen.findByRole("listbox");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("resposta antiga não sobrescreve a nova (guarda de stale)", async () => {
  let resolveAntiga!: (v: Response) => void;
  const antiga = new Promise<Response>((resolve) => {
    resolveAntiga = resolve;
  });
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("q=ab")) return antiga;
    return Promise.resolve(resposta(200, BUSCA_VIAGEM));
  });
  const user = userEvent.setup({ delay: null });
  montar();
  const input = screen.getByRole("combobox", { name: "Buscar" });
  await user.type(input, "ab");
  await act(() => vi.advanceTimersByTimeAsync(300));
  await user.clear(input);
  await user.type(input, "roma");
  await act(() => vi.advanceTimersByTimeAsync(300));
  const opcaoRoma = await screen.findByRole("option");
  expect(within(opcaoRoma).getByText("Roma", { exact: false })).toBeInTheDocument();
  resolveAntiga(resposta(200, BUSCA_CARL));
  await act(() => vi.advanceTimersByTimeAsync(10));
  expect(screen.queryByText("Carla Souza")).toBeNull();
  expect(screen.getByRole("option").textContent).toContain("Roma");
});
