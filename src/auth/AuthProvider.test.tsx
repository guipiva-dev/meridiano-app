import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

function Quem() {
  const { me, carregando, pode } = useAuth();
  if (carregando) return <p>carregando</p>;
  return <p>{me ? `${me.nome}:${String(pode("viagem.criar"))}` : "anônimo"}</p>;
}

beforeEach(() => {
  vi.restoreAllMocks();
  queryClient.clear();
});

test("carrega /auth/me e expõe pode()", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({ usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "Gui", permissoes: ["viagem.criar"] }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Quem />
      </AuthProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(screen.getByText("Gui:true")).toBeInTheDocument();
  });
});

test("401 vira anônimo sem erro", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }));
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Quem />
      </AuthProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(screen.getByText("anônimo")).toBeInTheDocument();
  });
});
