import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router";
import { UnauthenticatedError } from "@/api/errors";
import { queryClient } from "@/api/queryClient";
import { AuthProvider, CHAVE_ME } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";
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

function LoginStub() {
  const [params] = useSearchParams();
  return <p>Entrar:{params.get("voltar")}</p>;
}

test("401 no meio da sessão limpa o cache e redireciona para /login?voltar=", async () => {
  // 1ª chamada (/auth/me no mount) autenticada; a sessão expira de verdade depois disso,
  // então qualquer novo /auth/me (inclusive um refetch disparado pelo próprio clear()) já 401.
  let chamadas = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation(() => {
    chamadas += 1;
    return Promise.resolve(
      chamadas === 1
        ? new Response(
            JSON.stringify({ usuarioId: "1", agenciaId: "2", perfil: "dono", nome: "Gui", permissoes: [] }),
            { status: 200, headers: { "content-type": "application/json" } },
          )
        : new Response(null, { status: 401 }),
    );
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginStub />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<p>protegido</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await screen.findByText("protegido");

  // dado de outra consulta (ex.: lista de viagens) já em cache antes do 401 no meio da sessão
  queryClient.setQueryData(["outraConsulta"], { segredo: "dados do usuário anterior" });

  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => Promise.reject(new UnauthenticatedError(401, "nao_autenticado", "Sessão expirada")),
  });
  await mutation.execute(undefined).catch(() => undefined);

  await waitFor(() => {
    expect(screen.getByText("Entrar:/")).toBeInTheDocument();
  });
  // nenhum dado do usuário anterior sobrevive; só a consulta de `me` permanece, e nula
  expect(queryClient.getQueryData(["outraConsulta"])).toBeUndefined();
  expect(queryClient.getQueryData(CHAVE_ME)).toBeNull();
});
