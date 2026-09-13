import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { PessoaPage } from "./PessoaPage";

// ALT-02 (auditoria r4): e-mail "some" depois de salvar e reabrir. Round-trip form → payload → resposta → form.
const LUCIA = {
  id: "p1",
  versao: "7",
  nome: "Lúcia Mendes",
  cpf: "98765432100",
  email: "lucia.mendes@gmail.com",
  telefone: null,
  whatsapp: null,
  dataNascimento: "1977-02-14",
  cidade: null,
  uf: null,
  origemLead: null,
  tags: [],
  observacoes: null,
  contatoEmergencia: null,
  grupoId: null,
  grupoNome: null,
  criadoEm: "2023-03-01T12:00:00Z",
  resumo: { viagens: 0, ultimaViagem: null, pendenciasAbertas: 1, pendenciasUrgentes: 0, clienteDesde: 2023 },
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

const enviados: { method: string; body: Record<string, unknown> }[] = [];
/** Estado do "banco": o que o POST/PUT gravou é o que o GET devolve. */
let salvos: Record<string, Record<string, unknown>> = {};

beforeEach(() => {
  enviados.length = 0;
  salvos = { p1: LUCIA };
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : {};
    if (method !== "GET") enviados.push({ method, body });
    if (url === "/api/v1/clientes" && method === "POST") {
      salvos.novo1 = { ...LUCIA, ...body, id: "novo1", versao: "1" };
      return Promise.resolve(resposta(201, salvos.novo1));
    }
    const m = /^\/api\/v1\/clientes\/(\w+)$/.exec(url);
    if (m?.[1] && method === "PUT") {
      salvos[m[1]] = { ...salvos[m[1]], ...body, versao: "8" };
      return Promise.resolve(resposta(200, salvos[m[1]]));
    }
    if (m?.[1] && salvos[m[1]]) return Promise.resolve(resposta(200, salvos[m[1]]));
    if (url.startsWith("/api/v1/clientes/p1/pendencias")) {
      return Promise.resolve(resposta(200, [{ id: "pd1", titulo: "Renovar passaporte", status: "aberta" }]));
    }
    if (url.includes("/grupos?"))
      return Promise.resolve(resposta(200, { itens: [], total: 0, pagina: 1, tamanho: 25 }));
    return Promise.resolve(resposta(200, []));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function montar(entrada: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/clientes/nova", element: <PessoaPage /> },
      { path: "/clientes/:id", element: <PessoaPage /> },
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

test("nova pessoa: e-mail digitado vai no POST e volta repovoado ao reabrir (ALT-02)", async () => {
  montar("/clientes/nova");
  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: "QA Nova" } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "qa1205@teste.dev" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  await waitFor(() => {
    expect(enviados.find((e) => e.method === "POST")?.body).toMatchObject({ email: "qa1205@teste.dev" });
  });
  await screen.findAllByRole("tab");
  expect(await screen.findByDisplayValue("qa1205@teste.dev")).toBeInTheDocument();
});

test("pessoa existente: e-mail alterado vai no PUT e o form mostra o valor da resposta (ALT-02)", async () => {
  montar("/clientes/p1");
  fireEvent.change(await screen.findByDisplayValue("lucia.mendes@gmail.com"), {
    target: { value: "lucia.nova@gmail.com" },
  });
  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(enviados.find((e) => e.method === "PUT")?.body).toMatchObject({ email: "lucia.nova@gmail.com" });
  });
  expect(await screen.findByText(/✓ Salvo às/)).toBeInTheDocument();
  expect(screen.getByLabelText("E-mail")).toHaveValue("lucia.nova@gmail.com");
});

test("1 pendência aberta usa singular no badge (BAI-01)", async () => {
  montar("/clientes/p1");
  expect(await screen.findByText("1 pendência")).toBeInTheDocument();
});
