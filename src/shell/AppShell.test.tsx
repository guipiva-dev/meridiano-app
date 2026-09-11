import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { AppShell } from "./AppShell";

function montar() {
  vi.stubGlobal(
    "fetch",
    () =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve({ agenda: 0, financeiro: null, clientes: null }),
      }) as unknown as Promise<Response>,
  );
  const v: AuthValue = {
    me: { usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "A", permissoes: ["viagem.ver"] },
    carregando: false,
    pode: (p) => p === "viagem.ver",
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={v}>
        <MemoryRouter initialEntries={["/viagens"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/viagens" element={<p>conteúdo</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// Nota: este ambiente de teste (vitest/jsdom) não injeta o CSS real dos
// componentes (nenhuma <style> chega ao documento), então `visibility`
// definido em Sidebar.module.css não é observável aqui — a asserção
// possível é o estado ARIA/DOM (aria-expanded, foco), que é o que
// realmente governa o comportamento de acessibilidade testável.
test("abrir o menu marca aria-expanded e foca o primeiro link; Escape e o backdrop fecham", async () => {
  const user = userEvent.setup();
  montar();
  const menu = screen.getByRole("button", { name: "Menu" });
  const link = screen.getByRole("link", { name: /Viagens/ });
  expect(menu).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: "Fechar menu" })).toBeNull();

  await user.click(menu);
  expect(menu).toHaveAttribute("aria-expanded", "true");
  expect(link).toHaveFocus();
  expect(screen.getByRole("button", { name: "Fechar menu" })).toBeInTheDocument();

  await user.keyboard("{Escape}");
  expect(menu).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("button", { name: "Fechar menu" })).toBeNull();

  await user.click(menu);
  await user.click(screen.getByRole("button", { name: "Fechar menu" }));
  expect(menu).toHaveAttribute("aria-expanded", "false");
});
