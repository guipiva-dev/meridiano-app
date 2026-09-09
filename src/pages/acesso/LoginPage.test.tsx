import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
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
