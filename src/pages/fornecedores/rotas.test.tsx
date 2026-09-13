import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { RotasFornecedores } from "./rotas";

function montar(caminho: string, pode: (p: string) => boolean) {
  const auth: AuthValue = {
    me: { usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "A", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const router = createMemoryRouter(createRoutesFromElements(RotasFornecedores()), { initialEntries: [caminho] });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

// P01: só quem tem `fornecedor.ver` acessa /fornecedores/* (o vendedor externo não tem).
test("/fornecedores sem fornecedor.ver cai em Sem permissão", () => {
  montar("/fornecedores", () => false);
  expect(screen.getByText("Sem permissão")).toBeInTheDocument();
});

test("/fornecedores/nova com fornecedor.ver renderiza a página", () => {
  montar("/fornecedores/nova", (p) => p === "fornecedor.ver");
  expect(screen.getByRole("heading", { name: "Novo fornecedor" })).toBeInTheDocument();
});
