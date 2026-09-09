import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { Sidebar } from "./Sidebar";

function comPermissoes(permissoes: string[]) {
  const v: AuthValue = {
    me: { usuarioId: "1", agenciaId: "2", perfil: "agente", nome: "A", permissoes },
    carregando: false,
    pode: (p) => permissoes.includes(p),
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  return render(
    <AuthContext.Provider value={v}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

test("esconde itens sem permissão", () => {
  comPermissoes(["viagem.ver_proprias", "cliente.ver_proprios"]);
  expect(screen.getByRole("link", { name: /Viagens/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Equipe/ })).toBeNull();
  expect(screen.queryByText("Administração")).toBeNull();
});
