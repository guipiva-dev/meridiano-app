import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { RotaProtegida } from "./RotaProtegida";

function montar(pode: (p: string) => boolean) {
  const v: AuthValue = {
    me: { usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "A", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const router = createMemoryRouter(
    [
      {
        element: <RotaProtegida permissao="auditoria.ver" />,
        children: [{ path: "/auditoria", element: <p>conteúdo protegido</p> }],
      },
    ],
    { initialEntries: ["/auditoria"] },
  );
  return render(
    <AuthContext.Provider value={v}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

test("sem a permissão mostra Sem permissão e não renderiza a rota", () => {
  montar(() => false);
  expect(screen.getByText("Sem permissão")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ir para Viagens" })).toBeInTheDocument();
  expect(screen.queryByText("conteúdo protegido")).toBeNull();
});

test("com a permissão renderiza o Outlet", () => {
  montar((p) => p === "auditoria.ver");
  expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  expect(screen.queryByText("Sem permissão")).toBeNull();
});
