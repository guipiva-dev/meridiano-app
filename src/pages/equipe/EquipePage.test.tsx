import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { ToastHost } from "@/components/feedback";
import { EquipePage } from "./EquipePage";

function iso(offsetDias: number, hora: string) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const [h, m] = hora.split(":");
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

function diasNoFuturo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const EQUIPE = {
  itens: [
    {
      id: "u-guilherme",
      nome: "Guilherme Piva",
      email: "guilherme@vivaturismo.com.br",
      telefone: null,
      perfil: "dono",
      geraRepasse: false,
      percentualPadrao: 0,
      ativo: true,
      acesso: "acesso_ativo",
      ultimoLoginEm: iso(0, "09:12"),
      conviteExpiraEm: null,
      versao: "1",
    },
    {
      id: "u-ana",
      nome: "Ana Paula Ribeiro",
      email: "ana@vivaturismo.com.br",
      telefone: null,
      perfil: "vendedor_externo",
      geraRepasse: true,
      percentualPadrao: 10,
      ativo: true,
      acesso: "acesso_ativo",
      ultimoLoginEm: iso(-1, "18:40"),
      conviteExpiraEm: null,
      versao: "1",
    },
    {
      id: "u-marcos",
      nome: "Marcos Castro",
      email: "marcos@vivaturismo.com.br",
      telefone: null,
      perfil: "vendedor_externo",
      geraRepasse: true,
      percentualPadrao: 8,
      ativo: true,
      acesso: "sem_acesso",
      ultimoLoginEm: null,
      conviteExpiraEm: null,
      versao: "1",
    },
    {
      id: "u-claudia",
      nome: "Cláudia Ferreira",
      email: "claudia@contabilx.com.br",
      telefone: null,
      perfil: "contador",
      geraRepasse: false,
      percentualPadrao: 0,
      ativo: true,
      acesso: "acesso_ativo",
      ultimoLoginEm: "2020-04-02T10:00:00Z",
      conviteExpiraEm: null,
      versao: "1",
    },
    {
      id: "u-bruno",
      nome: "Bruno Sales",
      email: "bruno@vivaturismo.com.br",
      telefone: null,
      perfil: "agente",
      geraRepasse: false,
      percentualPadrao: 0,
      ativo: true,
      acesso: "convite_pendente",
      ultimoLoginEm: null,
      conviteExpiraEm: diasNoFuturo(2),
      versao: "1",
    },
  ],
  total: 5,
  comAcesso: 4,
  convitesPendentes: 1,
};

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

let chamadas: { url: string; method?: string }[] = [];
beforeEach(() => {
  chamadas = [];
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({ url, method: init?.method });
    if (url.includes("/usuarios") && (!init?.method || init.method === "GET")) {
      return Promise.resolve(resposta(200, EQUIPE));
    }
    if (url.includes("/convite")) return Promise.resolve(resposta(200, EQUIPE.itens[4]));
    return Promise.resolve(resposta(200, {}));
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function montar() {
  const auth: AuthValue = {
    me: { usuarioId: "u-guilherme", agenciaId: "a1", perfil: "dono", nome: "Guilherme", permissoes: [] },
    carregando: false,
    pode: () => true,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/equipe", element: <EquipePage /> },
      { path: "/equipe/nova", element: <span>Novo colaborador</span> },
      { path: "/equipe/:id", element: <span>Colaborador</span> },
    ],
    { initialEntries: ["/equipe"] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
        <ToastHost />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

test("mostra o subtítulo com os totais e a linha de cada colaborador", async () => {
  montar();
  expect(await screen.findByText("5 pessoas na equipe · 4 com acesso · 1 convite pendente")).toBeInTheDocument();
  expect(screen.getByText("Ana Paula Ribeiro")).toBeInTheDocument();
  expect(screen.getByText("gera · sugestão 10 %")).toBeInTheDocument();
});

test("Marcos (sem acesso) mostra a linha de apoio de vendedor externo e o botão Convidar", async () => {
  montar();
  await screen.findByText("Marcos Castro");
  expect(screen.getByText("vendedor externo · aparece nas viagens e repasses; não usa o sistema")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Convidar" })).toBeInTheDocument();
});

test("Bruno (convite pendente) mostra Reenviar; clicar chama o convite e mostra o toast", async () => {
  montar();
  await screen.findByText("Bruno Sales");
  fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));
  await waitFor(() => {
    expect(chamadas.some((c) => c.url === "/api/v1/usuarios/u-bruno/convite" && c.method === "POST")).toBe(true);
  });
  expect(await screen.findByText("Convite enviado para bruno@vivaturismo.com.br")).toBeInTheDocument();
});

test("Editar navega para /equipe/{id}", async () => {
  montar();
  await screen.findByText("Guilherme Piva");
  fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]!);
  expect(await screen.findByText("Colaborador")).toBeInTheDocument();
});

test("+ Convidar para acessar abre o modal e envia POST /auth/convites", async () => {
  montar();
  await screen.findByText("Guilherme Piva");
  fireEvent.click(screen.getByRole("button", { name: "+ Convidar para acessar" }));
  const dialogo = screen.getByRole("dialog");
  fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Nova Pessoa" } });
  fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: "nova@x.com" } });
  fireEvent.click(within(dialogo).getByRole("button", { name: "Convidar" }));
  await waitFor(() => {
    expect(chamadas.some((c) => c.url === "/api/v1/auth/convites" && c.method === "POST")).toBe(true);
  });
});
