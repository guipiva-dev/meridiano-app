import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { RotasApp } from "./rotasModulos";

const auth: AuthValue = {
  me: { usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "A", permissoes: [] },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

function montar(caminho: string) {
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
