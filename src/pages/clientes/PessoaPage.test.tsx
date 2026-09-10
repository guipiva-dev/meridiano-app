import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { PessoaPage } from "./PessoaPage";

const LUCIA = {
  id: "p1",
  versao: "7",
  nome: "Lúcia Mendes",
  cpf: "98765432100",
  email: "lucia.mendes@gmail.com",
  telefone: null,
  whatsapp: "11998765678",
  dataNascimento: "1977-02-14",
  cidade: "São Paulo",
  uf: "SP",
  origemLead: "Indicação",
  tags: ["lua de mel 2023"],
  observacoes: "Prefere hotel no centro.",
  contatoEmergencia: null,
  grupoId: "g1",
  grupoNome: "Família Mendes",
  criadoEm: "2023-03-01T12:00:00Z",
  resumo: {
    viagens: 3,
    ultimaViagem: null,
    pendenciasAbertas: 3,
    pendenciasUrgentes: 1,
    clienteDesde: 2023,
  },
};

const DOCUMENTOS = [
  {
    id: "d1",
    versao: "1",
    clienteId: "p1",
    tipo: "passaporte",
    numero: "GB998877",
    emissao: "2016-05-30",
    validade: "2026-05-30",
    paisEmissor: "Brasil",
    diasParaVencer: 32,
  },
  {
    id: "d2",
    versao: "1",
    clienteId: "p1",
    tipo: "rg",
    numero: "22.333.444-5",
    emissao: "2010-01-10",
    validade: null,
    paisEmissor: "SSP-SP",
    diasParaVencer: null,
  },
];

const VIAGENS = ["Lisboa", "Cancún", "Gramado"].map((destino, i) => ({
  id: `v${i}`,
  codigo: `VG-2026-004${i}`,
  destino,
  tipo: "internacional",
  dataIda: "2026-04-12",
  dataVolta: "2026-04-26",
  titular: false,
  faseOperacional: "emitida",
  faseFinanceira: "a_receber",
}));

const PENDENCIAS = ["Renovar passaporte", "Confirmar apólice", "Informar contato de emergência"].map((titulo, i) => ({
  id: `pd${i}`,
  versao: "1",
  titulo,
  descricao: null,
  dataPrevista: "2026-04-15",
  status: "aberta",
  prioridade: i === 0 ? "urgente" : "normal",
  origem: "automatica",
  responsavelId: null,
  responsavelNome: "Ana Paula",
  viagemId: null,
  viagemCodigo: null,
  clienteId: "p1",
  clienteNome: "Lúcia Mendes",
  concluidaEm: null,
}));

const ATENDIMENTOS = [
  {
    id: "a1",
    versao: "1",
    canal: "whatsapp",
    resumo: "Pediu orçamento",
    ocorridoEm: "2026-03-01T12:00:00Z",
    usuarioId: "u1",
    usuarioNome: "Ana",
  },
];

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

function auth(permissoes: string[]): AuthValue {
  return {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
    carregando: false,
    pode: (p: string) => permissoes.includes(p),
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
}

const TODAS = ["cliente.ver", "cliente.editar", "cliente.ver_documento"];

interface Chamada {
  method: string;
  url: string;
  body?: unknown;
}
const chamadas: Chamada[] = [];
let cliente: Record<string, unknown> = LUCIA;
let falhar = false;

function DetalheStub() {
  const { id } = useParams();
  return <div>Detalhe {id}</div>;
}

function montar(entrada = "/clientes/p1", permissoes = TODAS) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/clientes/nova", element: <PessoaPage /> },
      { path: "/clientes/:id", element: <PessoaPage /> },
      { path: "/clientes", element: <div>Lista</div> },
      { path: "/viagens/:id", element: <DetalheStub /> },
    ],
    { initialEntries: [entrada] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth(permissoes)}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  cliente = LUCIA;
  falhar = false;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(init.body as string) as Record<string, unknown>) : undefined;
    chamadas.push({ method, url, body });
    if (url === "/api/v1/clientes" && method === "POST") {
      return Promise.resolve(resposta(201, { ...LUCIA, ...body, id: "novo1", versao: "1" }));
    }
    if (url === "/api/v1/clientes/p1" && method === "PUT") {
      return Promise.resolve(resposta(200, { ...cliente, ...body, versao: "8" }));
    }
    if (url === "/api/v1/clientes/p1") {
      return Promise.resolve(falhar ? resposta(500, { detail: "falhou" }) : resposta(200, cliente));
    }
    if (url === "/api/v1/clientes/novo1") return Promise.resolve(resposta(200, { ...LUCIA, id: "novo1" }));
    if (url.startsWith("/api/v1/clientes/p1/documentos")) return Promise.resolve(resposta(200, DOCUMENTOS));
    if (url.startsWith("/api/v1/clientes/p1/viagens")) return Promise.resolve(resposta(200, VIAGENS));
    if (url.startsWith("/api/v1/clientes/p1/pendencias")) return Promise.resolve(resposta(200, PENDENCIAS));
    if (url.startsWith("/api/v1/clientes/p1/atendimentos")) return Promise.resolve(resposta(200, ATENDIMENTOS));
    if (url.includes("/anexos")) return Promise.resolve(resposta(200, []));
    if (url.includes("/grupos?")) return Promise.resolve(resposta(200, GRUPOS));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, []));
    return Promise.resolve(resposta(200, []));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("cabeçalho e as cinco abas com contadores", async () => {
  montar();

  expect(await screen.findByRole("heading", { name: /Lúcia Mendes/ })).toBeInTheDocument();
  expect(screen.getByText(/987\.654\.321-00 · Família Mendes · 3 viagens · cliente desde 2023/)).toBeInTheDocument();
  expect(screen.getByText("3 pendências")).toBeInTheDocument();

  const abas = await screen.findAllByRole("tab");
  expect(abas.map((t) => t.textContent)).toEqual(["Dados", "Documentos", "Pendências3", "Viagens3", "Atendimentos1"]);
});

// LGPD: GET /clientes/{id}/documentos grava log_acesso_documento; só a aba Documentos pode dispará-lo.
test("abrir a pessoa não busca os documentos; a aba Documentos busca", async () => {
  montar();
  await screen.findByDisplayValue("São Paulo");

  expect(chamadas.some((c) => c.url.includes("/clientes/p1/documentos"))).toBe(false);

  fireEvent.click(screen.getByRole("tab", { name: "Documentos" }));

  await waitFor(() => {
    expect(chamadas.some((c) => c.url.includes("/clientes/p1/documentos"))).toBe(true);
  });
});

test("carga que falha mostra o erro, não um formulário de nova pessoa", async () => {
  falhar = true;
  montar();

  expect(await screen.findByText("Não foi possível carregar esta pessoa.")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Nova pessoa" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
});

test("sem cliente.editar não há Salvar e Ctrl+S não salva", async () => {
  montar("/clientes/p1", ["cliente.ver"]);
  const cidade = await screen.findByDisplayValue("São Paulo");

  expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();

  fireEvent.change(cidade, { target: { value: "Campinas" } });
  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(screen.getByText("● Alterações não salvas")).toBeInTheDocument();
  });
  expect(chamadas.some((c) => c.method === "PUT")).toBe(false);
});

test("editar um campo marca alterações não salvas e Ctrl+S salva com a versão", async () => {
  montar();
  const cidade = await screen.findByDisplayValue("São Paulo");

  fireEvent.change(cidade, { target: { value: "Campinas" } });
  expect(await screen.findByText("● Alterações não salvas")).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "PUT" && c.url === "/api/v1/clientes/p1")).toBe(true);
  });
  const put = chamadas.find((c) => c.method === "PUT");
  expect(put?.body).toMatchObject({ versao: "7", cidade: "Campinas", cpf: "98765432100" });
  expect(await screen.findByText(/✓ Salvo às/)).toBeInTheDocument();
});

test("/clientes/nova não tem abas e salvar cria e navega para a pessoa", async () => {
  montar("/clientes/nova");

  expect(screen.getByRole("heading", { name: "Nova pessoa" })).toBeInTheDocument();
  expect(screen.queryAllByRole("tab")).toHaveLength(0);

  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: "Bia Nova" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "POST" && c.url === "/api/v1/clientes")).toBe(true);
  });
  const post = chamadas.find((c) => c.method === "POST");
  expect(post?.body).toMatchObject({ nome: "Bia Nova", telefone: null });
  expect(await screen.findAllByRole("tab")).toHaveLength(5);
});

test("sem cliente.ver_documento o campo CPF não é renderizado", async () => {
  const semCpf: Record<string, unknown> = { ...LUCIA };
  delete semCpf.cpf;
  cliente = semCpf;
  montar("/clientes/p1", ["cliente.ver", "cliente.editar"]);

  await screen.findByDisplayValue("São Paulo");
  expect(screen.queryByLabelText("CPF")).not.toBeInTheDocument();
});
