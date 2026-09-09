import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ViagemDto } from "@/api/viagens";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { VIAGEM } from "./fixtures";
import { ViagemPage } from "./ViagemPage";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function autorizacao(permitido: (p: string) => boolean): AuthValue {
  return {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
    carregando: false,
    pode: permitido,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
}

let viagem: ViagemDto = VIAGEM;

function montar(entrada = "/viagens/v1", pode: (p: string) => boolean = () => true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/viagens/:id", element: <ViagemPage /> }], {
    initialEntries: [entrada],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={autorizacao(pode)}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  viagem = VIAGEM;
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/pendencias")) return Promise.resolve(resposta(200, []));
    if (url.includes("/anexos")) return Promise.resolve(resposta(200, []));
    if (url.includes("/creditos")) return Promise.resolve(resposta(200, []));
    if (url.includes("/auditoria")) return Promise.resolve(resposta(200, []));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, []));
    if (url.endsWith("/viagens/v1")) return Promise.resolve(resposta(200, viagem));
    return Promise.resolve(resposta(200, []));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("cabeçalho traz titular · destino, código e período", async () => {
  montar();
  expect(await screen.findByRole("heading", { name: /Carlos Mendes · Lisboa/ })).toBeInTheDocument();
  expect(screen.getByText("VG-2026-0042")).toBeInTheDocument();
  expect(
    screen.getByText("18–28/04/2026 · Internacional · 2 passageiros · Vendedor(a): Ana Paula · Agente: Guilherme"),
  ).toBeInTheDocument();
});

test("faixa do resumo mostra o resultado da viagem", async () => {
  montar();
  expect(await screen.findByText("R$ 1.640,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 13.700,00")).toBeInTheDocument();
});

test("aba Reservas mostra os dois cards", async () => {
  montar("/viagens/v1?tab=reservas");
  expect(await screen.findByText("Reserva 1")).toBeInTheDocument();
  expect(screen.getByText("Reserva 2")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Reservas/ })).toHaveTextContent("2");
});

test("sem auditoria.ver a aba Timeline não aparece", async () => {
  montar("/viagens/v1", (p) => p !== "auditoria.ver");
  await screen.findByRole("tab", { name: /Resumo/ });
  expect(screen.queryByRole("tab", { name: /Timeline/ })).toBeNull();
});

test("Cancelar viagem… abre o modal", async () => {
  montar();
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar viagem…" }));
  expect(await screen.findByRole("dialog")).toHaveTextContent("Cancelar viagem");
});

test("viagem cancelada esconde Editar e mostra o alerta", async () => {
  viagem = {
    ...VIAGEM,
    cancelada: true,
    canceladaEm: "2026-03-01T10:00:00Z",
    motivoCancelamento: "Cliente desistiu",
    faseOperacional: "cancelada",
  };
  montar();
  expect(await screen.findByText(/Viagem cancelada em 01\/03\/2026: Cliente desistiu/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
});
