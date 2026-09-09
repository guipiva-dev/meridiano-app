import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { LoginPage } from "./LoginPage";

function montar() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  queryClient.clear();
});

test("senha errada mostra o texto do protótipo", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(null, { status: 401 })));
  montar();
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/E-mail/), "a@b.com");
  await user.type(screen.getByLabelText(/Senha/), "errada");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
  });
});

function montarComRouter(caminhoInicial: string) {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/", element: <p>Home</p> },
      { path: "/viagens/1", element: <p>Viagem 1</p> },
    ],
    { initialEntries: [caminhoInicial] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function mockFetchFluxoLogin() {
  let logado = false;
  vi.spyOn(globalThis, "fetch").mockImplementation((url, init) => {
    const caminho = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
    if (caminho.endsWith("/auth/me")) {
      return Promise.resolve(
        logado
          ? new Response(
              JSON.stringify({ usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "Gui", permissoes: [] }),
              { status: 200, headers: { "content-type": "application/json" } },
            )
          : new Response(null, { status: 401 }),
      );
    }
    if (caminho.endsWith("/auth/login") && init?.method === "POST") {
      logado = true;
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.resolve(new Response(null, { status: 404 }));
  });
}

async function logar() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/E-mail/), "a@b.com");
  await user.type(screen.getByLabelText(/Senha/), "12345678");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

test("voltar=//evil.com (protocol-relative) cai em / após login, não no host externo", async () => {
  mockFetchFluxoLogin();
  montarComRouter("/login?voltar=%2F%2Fevil.com");
  await logar();
  await waitFor(() => {
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});

test("voltar=/viagens/1 (caminho interno) cai em /viagens/1 após login", async () => {
  mockFetchFluxoLogin();
  montarComRouter("/login?voltar=%2Fviagens%2F1");
  await logar();
  await waitFor(() => {
    expect(screen.getByText("Viagem 1")).toBeInTheDocument();
  });
});
