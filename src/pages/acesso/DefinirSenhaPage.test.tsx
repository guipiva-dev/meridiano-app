import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { DefinirSenhaPage } from "./DefinirSenhaPage";

test("remove o token da URL e ainda consulta a API com ele", async () => {
  const urls: string[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation((url: string | URL | Request) => {
    urls.push(url instanceof Request ? url.url : url.toString());
    return Promise.resolve(
      new Response(JSON.stringify({ nome: "Ana", email: "ana@x.com", tipo: "convite" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/definir-senha", element: <DefinirSenhaPage /> }], {
    initialEntries: ["/definir-senha?token=abc123"],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByDisplayValue("ana@x.com")).toBeInTheDocument();
  await waitFor(() => {
    expect(router.state.location.search).not.toContain("token");
  });
  expect(urls.some((u) => u.includes("/auth/tokens?token=abc123"))).toBe(true);
  vi.restoreAllMocks();
});
