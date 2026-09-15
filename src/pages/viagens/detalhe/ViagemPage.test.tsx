import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ViagemDto } from "@/api/viagens";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { formatarCarimbo } from "@/lib/datas";
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
  expect(screen.getByRole("navigation", { name: "Trilha" })).toHaveTextContent("VG-2026-0042");
  expect(
    screen.getByText("18–28/04/2026 · Internacional · 2 passageiros · Vendedor: Ana Paula · Agente: Guilherme"),
  ).toBeInTheDocument();
});

test("badge financeiro do cabeçalho traz o prefixo Comissão e explica o que representa", async () => {
  montar();
  const badge = await screen.findByText("Comissão: A receber");
  expect(badge.closest("[title]")).toHaveAttribute(
    "title",
    "Situação da comissão dos fornecedores nas reservas ativas",
  );
});

test("painel lateral mostra o resultado da viagem", async () => {
  montar();
  const painel = await screen.findByRole("complementary", { name: "Resumo da viagem" });
  expect(within(painel).getByText("R$ 1.640,00")).toBeInTheDocument();
  expect(within(painel).getByText("R$ 13.700,00")).toBeInTheDocument();
});

test("abas começam em Reservas, sem Resumo e sem Subnav", async () => {
  montar();
  await screen.findByRole("tab", { name: /Reservas/ });
  expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
    expect.stringMatching(/^Reservas/),
    "Financeiro",
    expect.stringMatching(/^Pendências/),
    expect.stringMatching(/^Documentos/),
    "Timeline",
  ]);
  expect(screen.queryByRole("tab", { name: /Resumo/ })).toBeNull();
  expect(screen.getByRole("tab", { name: /Reservas/ })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByRole("navigation", { name: "Seções do módulo" })).toBeNull();
});

test("Ver todas do painel troca para a aba Pendências", async () => {
  montar();
  const painel = await screen.findByRole("complementary", { name: "Resumo da viagem" });
  fireEvent.click(within(painel).getByRole("button", { name: "Ver todas" }));
  expect(screen.getByRole("tab", { name: /Pendências/ })).toHaveAttribute("aria-selected", "true");
});

test("aba Reservas mostra os dois cards", async () => {
  montar();
  expect(await screen.findByLabelText("Reserva 1")).toBeInTheDocument();
  expect(screen.getByLabelText("Reserva 2")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Reservas/ })).toHaveTextContent("2");
});

test("com reserva cancelada, a aba Reservas mostra Ativas N · Total M", async () => {
  viagem = { ...VIAGEM, reservas: [VIAGEM.reservas[0]!, { ...VIAGEM.reservas[1]!, status: "cancelada" }] };
  montar();
  expect(await screen.findByRole("tab", { name: /Reservas.*Ativas 1.*Total 2/ })).toBeInTheDocument();
});

test("sem auditoria.ver a aba Timeline não aparece", async () => {
  montar("/viagens/v1", (p) => p !== "auditoria.ver");
  await screen.findByRole("tab", { name: /Reservas/ });
  expect(screen.queryByRole("tab", { name: /Timeline/ })).toBeNull();
});

test("Cancelar viagem… abre o modal", async () => {
  montar();
  fireEvent.click(await screen.findByRole("button", { name: "Mais ações" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Cancelar viagem…" }));
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
  // `cancelada_em` é timestamptz: o carimbo sai no fuso local.
  const carimbo = formatarCarimbo("2026-03-01T10:00:00Z");
  expect(await screen.findByText(`Viagem cancelada em ${carimbo}: Cliente desistiu`)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Transferir" })).toBeNull();
});

test("um passageiro no singular", async () => {
  viagem = { ...VIAGEM, passageiros: [VIAGEM.passageiros[0]!] };
  montar();
  expect(await screen.findByText(/· 1 passageiro ·/)).toBeInTheDocument();
});

test("F07: título da aba traz código · destino depois de carregar", async () => {
  montar();
  await screen.findByRole("heading", { name: /Carlos Mendes · Lisboa/ });
  expect(document.title).toBe("VG-2026-0042 · Lisboa · Meridiano");
});
