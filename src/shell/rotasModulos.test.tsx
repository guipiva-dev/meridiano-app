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
test("/clientes/:id renderiza Cliente, não a página não encontrada", () => {
  montar("/clientes/abc");
  expect(screen.getByRole("heading", { name: "Cliente" })).toBeInTheDocument();
  expect(screen.queryByText("Página não encontrada")).toBeNull();
});

test("/clientes/grupos continua ganhando da rota dinâmica", () => {
  montar("/clientes/grupos");
  expect(screen.getByRole("heading", { name: "Grupos" })).toBeInTheDocument();
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
