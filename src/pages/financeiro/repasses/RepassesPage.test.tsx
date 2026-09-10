import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { RepassesPage } from "./RepassesPage";

function item(over: Record<string, unknown>) {
  return {
    id: "rp1",
    versao: "1",
    viagemId: "v1",
    codigo: "VG-2026-0038",
    titular: "Sem nome",
    destino: "Lugar",
    usuarioId: "u1",
    valor: 0,
    status: "a_pagar",
    liberadoEm: "2026-04-01T10:00:00Z",
    pagoEm: null,
    observacao: null,
    aguardando: 0,
    ultimoRecebimentoEm: null,
    ...over,
  };
}

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Financeiro · Repasses).
const REPASSES = {
  kpis: { aPagarValor: 1150, aPagarVendedores: 2, aPagarViagens: 5, bloqueadoValor: 2380, bloqueadoViagens: 9, semValor: 3 },
  vendedores: [
    {
      usuarioId: "u1",
      nome: "Ana Paula Ribeiro",
      viagensAno: 12,
      aPagarValor: 850,
      aPagarViagens: 3,
      itens: [
        item({ id: "rp1", codigo: "VG-2026-0038", titular: "Família Oliveira", destino: "Gramado", valor: 250, ultimoRecebimentoEm: "2026-04-02" }),
        item({ id: "rp2", codigo: "VG-2026-0035", titular: "Juliana Prado", destino: "Buenos Aires", valor: 200, ultimoRecebimentoEm: "2026-03-28" }),
        item({ id: "rp3", codigo: "VG-2026-0033", titular: "Roberto Tanaka", destino: "Orlando", valor: 400, ultimoRecebimentoEm: "2026-03-30" }),
      ],
    },
    {
      usuarioId: "u2",
      nome: "Marcos Castro",
      viagensAno: 4,
      aPagarValor: 300,
      aPagarViagens: 2,
      itens: [
        item({
          id: "rp5",
          usuarioId: "u2",
          codigo: "VG-2026-0029",
          titular: "Beatriz Campos",
          destino: "Salvador",
          valor: 180,
          ultimoRecebimentoEm: "2026-03-15",
        }),
        item({
          id: "rp6",
          usuarioId: "u2",
          codigo: "VG-2026-0030",
          titular: "Henrique Dias",
          destino: "Foz do Iguaçu",
          valor: 120,
          ultimoRecebimentoEm: "2026-03-20",
        }),
      ],
    },
  ],
  pagos: null,
  ano: 2026,
};

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar(pode: (p: string) => boolean = () => true) {
  const auth: AuthValue = {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/financeiro/repasses", element: <RepassesPage /> }], {
    initialEntries: ["/financeiro/repasses"],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

let ultimaUrl = "";
beforeEach(() => {
  ultimaUrl = "";
  vi.stubGlobal("fetch", (url: string) => {
    ultimaUrl = url;
    if (url.includes("/repasses")) return Promise.resolve(resposta(200, REPASSES));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("mostra os KPIs e os cards de cada vendedor", async () => {
  montar();
  expect(await screen.findByText("R$ 1.150,00")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("Ana Paula Ribeiro")).toBeInTheDocument();
  expect(screen.getByText("Marcos Castro")).toBeInTheDocument();
});

test("Pagar abre o PagarRepasseModal com o total do vendedor", async () => {
  montar();
  await screen.findByText("Ana Paula Ribeiro");
  fireEvent.click(screen.getByRole("button", { name: "Pagar R$ 850,00" }));
  const dialogo = screen.getByRole("dialog");
  expect(within(dialogo).getByText("Pagar R$ 850,00 a Ana Paula Ribeiro?")).toBeInTheDocument();
});

test("Histórico refaz a busca com ?pagos= na URL", async () => {
  montar();
  await screen.findByText("Ana Paula Ribeiro");
  fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
  await waitFor(() => {
    expect(ultimaUrl).toContain("?pagos=");
  });
  expect(screen.getByRole("button", { name: "Voltar aos abertos" })).toBeInTheDocument();
});

test("perfil externa sem repasse.pagar não vê botão Pagar nem input de valor", async () => {
  montar((p) => p !== "repasse.pagar");
  await screen.findByText("Ana Paula Ribeiro");
  expect(screen.queryByRole("button", { name: /Pagar R\$/ })).toBeNull();
  expect(screen.queryByLabelText(/Valor do repasse/)).toBeNull();
});
