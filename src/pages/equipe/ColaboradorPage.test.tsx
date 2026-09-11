import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { ColaboradorPage } from "./ColaboradorPage";

const ANA = {
  id: "u-ana",
  nome: "Ana Paula Ribeiro",
  email: "ana@vivaturismo.com.br",
  telefone: null,
  perfil: "vendedor_externo",
  geraRepasse: true,
  percentualPadrao: 10,
  ativo: true,
  acesso: "acesso_ativo",
  ultimoLoginEm: "2026-04-10T18:40:00Z",
  conviteExpiraEm: null,
  versao: "1",
};

const PERFIS = [
  {
    perfil: "dono",
    permissoes: [
      "viagem.ver",
      "viagem.ver_resultado",
      "reserva.ver_valores",
      "cliente.ver",
      "cliente.ver_documento",
      "financeiro.conciliar",
      "repasse.ver_todos",
      "usuario.gerenciar",
      "auditoria.ver",
    ],
  },
  {
    perfil: "vendedor_externo",
    permissoes: ["viagem.ver_proprias", "cliente.ver_proprios"],
  },
  {
    perfil: "agente",
    permissoes: ["viagem.ver", "reserva.ver_valores", "cliente.ver", "cliente.ver_documento"],
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

let chamadas: { url: string; method?: string; body?: unknown }[] = [];
beforeEach(() => {
  chamadas = [];
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({ url, method: init?.method, body: init?.body ? JSON.parse(init.body as string) : undefined });
    if (url.endsWith("/usuarios/perfis")) return Promise.resolve(resposta(200, PERFIS));
    if (url.endsWith("/usuarios/u-ana") && (!init?.method || init.method === "GET")) {
      return Promise.resolve(resposta(200, ANA));
    }
    if (url.endsWith("/usuarios/u-ana") && init?.method === "PUT") {
      return Promise.resolve(resposta(200, { ...ANA, versao: "2" }));
    }
    if (url.endsWith("/usuarios") && init?.method === "POST") {
      return Promise.resolve(resposta(201, { ...ANA, id: "u-nova", nome: "Bruno Sales" }));
    }
    return Promise.resolve(resposta(200, {}));
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function montar(entrada: string) {
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
      { path: "/equipe/nova", element: <ColaboradorPage /> },
      { path: "/equipe/:id", element: <ColaboradorPage /> },
      { path: "/equipe", element: <span>Equipe</span> },
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

test("carrega, edita o nome, salva com Ctrl+S e mostra Salvo às", async () => {
  montar("/equipe/u-ana");
  const nome = await screen.findByDisplayValue("Ana Paula Ribeiro");
  fireEvent.change(nome, { target: { value: "Ana P. Ribeiro" } });
  fireEvent.keyDown(document, { key: "s", ctrlKey: true });
  await waitFor(() => {
    const put = chamadas.find((c) => c.method === "PUT");
    expect(put).toBeTruthy();
    expect((put?.body as { versao: string }).versao).toBe("1");
  });
  expect(await screen.findByText(/Salvo às/)).toBeInTheDocument();
});

test("botão Salvar também envia o PUT", async () => {
  montar("/equipe/u-ana");
  await screen.findByDisplayValue("Ana Paula Ribeiro");
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "PUT")).toBe(true);
  });
});

test("422 ultimo_dono mostra o alerta", async () => {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({ url, method: init?.method });
    if (url.endsWith("/usuarios/perfis")) return Promise.resolve(resposta(200, PERFIS));
    if (url.endsWith("/usuarios/u-ana") && (!init?.method || init.method === "GET")) {
      return Promise.resolve(resposta(200, ANA));
    }
    if (url.endsWith("/usuarios/u-ana") && init?.method === "PUT") {
      return Promise.resolve({
        ok: false,
        status: 422,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({ codigo: "ultimo_dono", detail: "..." }),
      } as unknown as Response);
    }
    return Promise.resolve(resposta(200, {}));
  });
  montar("/equipe/u-ana");
  await screen.findByDisplayValue("Ana Paula Ribeiro");
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(await screen.findByText("A agência precisa de ao menos um Dono ativo")).toBeInTheDocument();
});

test("/equipe/nova envia POST /usuarios", async () => {
  montar("/equipe/nova");
  await screen.findByLabelText(/^Nome/);
  fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: "Bruno Sales" } });
  fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: "bruno@x.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => {
    const post = chamadas.find((c) => c.method === "POST" && c.url.endsWith("/usuarios"));
    expect(post).toBeTruthy();
  });
});

test("PerfilVe para vendedor_externo mostra 'só as próprias' e resultado com X; trocar para agente atualiza", async () => {
  montar("/equipe/u-ana");
  await screen.findByDisplayValue("Ana Paula Ribeiro");
  await screen.findByText("só as próprias");
  expect(screen.getByText("resultado")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/^Perfil/), { target: { value: "agente" } });
  // agente tem viagem.ver e cliente.ver: as duas linhas passam a mostrar "todas".
  expect(screen.getAllByText("todas")).toHaveLength(2);
  expect(screen.queryByText("só as próprias")).toBeNull();
});
