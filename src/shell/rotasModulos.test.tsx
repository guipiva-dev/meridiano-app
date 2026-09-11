import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { RotasApp } from "./rotasModulos";

function montar(caminho: string, pode: (p: string) => boolean = () => true) {
  const auth: AuthValue = {
    me: { usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "A", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const router = createMemoryRouter(createRoutesFromElements(RotasApp()), { initialEntries: [caminho] });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

// A busca global linka para /clientes/<id>; sem a rota o resultado caía no 404.
test("/clientes/:id renderiza a pessoa, não a página não encontrada", async () => {
  const pessoa = {
    id: "abc",
    versao: "1",
    nome: "Marina Alves",
    email: null,
    telefone: null,
    whatsapp: null,
    dataNascimento: null,
    cidade: null,
    uf: null,
    origemLead: null,
    tags: [],
    observacoes: null,
    contatoEmergencia: null,
    grupoId: null,
    grupoNome: null,
    criadoEm: "2026-01-01T00:00:00Z",
    resumo: { viagens: 0, ultimaViagem: null, pendenciasAbertas: 0, pendenciasUrgentes: 0, clienteDesde: 2026 },
  };
  vi.stubGlobal("fetch", (url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve(url.endsWith("/clientes/abc") ? pessoa : []),
    } as unknown as Response),
  );

  montar("/clientes/abc");

  expect(await screen.findByRole("heading", { name: "Marina Alves" })).toBeInTheDocument();
  expect(screen.queryByText("Página não encontrada")).toBeNull();
  vi.unstubAllGlobals();
});

test("/clientes/grupos continua ganhando da rota dinâmica", () => {
  montar("/clientes/grupos");
  expect(screen.getByRole("heading", { name: /Grupos e empresas/ })).toBeInTheDocument();
});

// C7: o Contador só tem financeiro.ver_dre e precisa enxergar o módulo em leitura.
test("/financeiro exige uma das três permissões do módulo", () => {
  montar("/financeiro", (p) => p === "financeiro.ver_dre");
  expect(screen.getByRole("heading", { name: "Comissões a receber" })).toBeInTheDocument();
});

test("/financeiro sem nenhuma permissão do módulo cai em Sem permissão", () => {
  montar("/financeiro", (p) => p === "viagem.ver");
  expect(screen.getByText("Sem permissão")).toBeInTheDocument();
});

// 3.6 (R16): /agenda deixa de ser aberta — exige ver viagens (todas ou as próprias).
test("/agenda sem viagem.ver nem viagem.ver_proprias cai em Sem permissão", () => {
  montar("/agenda", () => false);
  expect(screen.getByText("Sem permissão")).toBeInTheDocument();
});

test("/relatorios abre só com relatorio.ver", () => {
  montar("/relatorios", (p) => p === "relatorio.ver");
  expect(screen.getByRole("heading", { name: "Relatórios" })).toBeInTheDocument();
});

test("/equipe/:id sem usuario.gerenciar cai em Sem permissão", () => {
  montar("/equipe/abc", (p) => p !== "usuario.gerenciar");
  expect(screen.getByText("Sem permissão")).toBeInTheDocument();
});

test("/auditoria abre com auditoria.ver", () => {
  montar("/auditoria", (p) => p === "auditoria.ver");
  expect(screen.getByRole("heading", { name: "Auditoria" })).toBeInTheDocument();
});
