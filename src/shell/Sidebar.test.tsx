import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { BadgesDto } from "@/api/agenda";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { Sidebar } from "./Sidebar";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function comPermissoes(permissoes: string[], badges?: BadgesDto) {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(resposta(200, badges ?? { agenda: 0, financeiro: null, clientes: null })),
  );
  const v: AuthValue = {
    me: { usuarioId: "1", agenciaId: "2", perfil: "agente", nome: "A", permissoes },
    carregando: false,
    pode: (p) => permissoes.includes(p),
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={v}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("esconde itens sem permissão", () => {
  comPermissoes(["viagem.ver_proprias", "cliente.ver_proprios"]);
  expect(screen.getByRole("link", { name: /Viagens/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Equipe/ })).toBeNull();
  expect(screen.queryByText("Administração")).toBeNull();
});

test("mostra badge em Agenda e Financeiro quando > 0, nenhum em Clientes (null)", async () => {
  comPermissoes(["viagem.ver", "financeiro.movimentar", "cliente.ver"], {
    agenda: 7,
    financeiro: 2,
    clientes: null,
  });

  expect(await screen.findByText("7")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  const clientesLink = screen.getByRole("link", { name: "Clientes" });
  expect(clientesLink).toHaveTextContent("Clientes");
});

test("badge 0 não renderiza", async () => {
  comPermissoes(["viagem.ver"], { agenda: 0, financeiro: null, clientes: null });

  const link = await screen.findByRole("link", { name: "Agenda" });
  expect(link).not.toHaveTextContent(/\d/);
});
