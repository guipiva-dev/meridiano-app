import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { ConciliacaoPage } from "./ConciliacaoPage";

function item(over: Record<string, unknown>) {
  return {
    reservaId: "r0",
    viagemId: "v0",
    codigo: "VG-2026-0000",
    titular: "Sem nome",
    destino: "Lugar",
    localizador: "AAA",
    fornecedorId: "f1",
    fornecedorNome: "CVC",
    dataCompra: "2026-01-10",
    dataPrevistaComissao: "2026-04-05",
    situacaoComissao: "a_receber",
    diasAtraso: null,
    esperado: 0,
    recebido: 0,
    saldo: 0,
    conciliacaoEncerrada: false,
    divergenciaMotivo: null,
    ultimoRecebimentoEm: null,
    elegivelLote: true,
    ...over,
  };
}

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Financeiro · Conciliação).
const CONCILIACAO = {
  itens: [
    item({
      reservaId: "r1",
      viagemId: "v38",
      codigo: "VG-2026-0038",
      titular: "Família Oliveira",
      destino: "Gramado",
      localizador: "CVC-77A2Q",
      dataPrevistaComissao: "2026-02-20",
      situacaoComissao: "atrasada",
      diasAtraso: 41,
      esperado: 740,
      saldo: 740,
    }),
    item({
      reservaId: "r2",
      viagemId: "v33",
      codigo: "VG-2026-0033",
      titular: "Roberto Tanaka",
      destino: "Orlando",
      localizador: "AZ-90213",
      fornecedorId: "f2",
      fornecedorNome: "Azul Viagens",
      dataPrevistaComissao: "2026-03-10",
      situacaoComissao: "atrasada",
      diasAtraso: 23,
      esperado: 2350,
      saldo: 2350,
    }),
    item({
      reservaId: "r3",
      viagemId: "v40",
      codigo: "VG-2026-0040",
      titular: "Marcos e Renata Lima",
      destino: "Noronha",
      localizador: "DCL-71100",
      fornecedorId: "f3",
      fornecedorNome: "Decolar",
      dataPrevistaComissao: "2026-03-28",
      situacaoComissao: "parcial",
      esperado: 1180,
      recebido: 600,
      saldo: 580,
      elegivelLote: false,
    }),
    item({
      reservaId: "r4",
      viagemId: "v42",
      codigo: "VG-2026-0042",
      titular: "Carlos Mendes",
      destino: "Lisboa",
      localizador: "K7X2PQ",
      esperado: 1600,
      saldo: 1600,
    }),
    item({
      reservaId: "r5",
      viagemId: "v42",
      codigo: "VG-2026-0042",
      titular: "Carlos Mendes",
      destino: "Lisboa",
      localizador: "DCL-88213",
      fornecedorId: "f3",
      fornecedorNome: "Decolar",
      esperado: 320,
      saldo: 320,
    }),
    item({
      reservaId: "r6",
      viagemId: "v41",
      codigo: "VG-2026-0041",
      titular: "Ana Beatriz Souza",
      destino: "Cancún",
      localizador: "CVC-3391B",
      dataPrevistaComissao: "2026-04-20",
      esperado: 1610,
      saldo: 1610,
    }),
  ],
  total: 14,
  pagina: 1,
  tamanho: 25,
  mes: "2026-03",
  contadores: { pendentes: 14, atrasadas: 3, recebidasMes: 22, divergencias: 1 },
  kpis: {
    aReceber: { valor: 18420, reservas: 14, extra: 6 },
    atrasadas: { valor: 3090, reservas: 3, extra: 41 },
    vencemSemana: { valor: 5240, reservas: 4, extra: null },
    recebidoMes: { valor: 9150, variacaoPercentual: 12 },
  },
};

const FORNECEDORES = [
  { id: "f1", nome: "CVC" },
  { id: "f2", nome: "Azul Viagens" },
  { id: "f3", nome: "Decolar" },
];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar(pode: (p: string) => boolean = () => true, entrada = "/financeiro") {
  const auth: AuthValue = {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/financeiro", element: <ConciliacaoPage /> },
      { path: "/viagens/:id", element: <div>Detalhe da viagem</div> },
    ],
    { initialEntries: [entrada] },
  );
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/conciliacao?")) return Promise.resolve(resposta(200, CONCILIACAO));
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Linha da tabela pelo titular (a célula Reserva mostra titular · destino). */
function linha(titular: string) {
  return screen.getByRole("row", { name: new RegExp(titular) });
}

test("mostra os quatro KPIs do protótipo", async () => {
  montar();
  expect(await screen.findByText("R$ 18.420,00")).toBeInTheDocument();
  expect(screen.getByText("14 reservas · 6 operadoras")).toBeInTheDocument();
  expect(screen.getByText("R$ 3.090,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 5.240,00")).toBeInTheDocument();
  expect(screen.getByText("R$ 9.150,00")).toBeInTheDocument();
  expect(screen.getByText(/▲ 12 % vs/)).toBeInTheDocument();
});

test("as abas mostram os contadores", async () => {
  montar();
  await screen.findByText("R$ 18.420,00");
  expect(screen.getByRole("tab", { name: /Pendentes/ })).toHaveTextContent("14");
  expect(screen.getByRole("tab", { name: /Atrasadas/ })).toHaveTextContent("3");
  expect(screen.getByRole("tab", { name: /Recebidas em março/ })).toHaveTextContent("22");
  expect(screen.getByRole("tab", { name: /Divergências/ })).toHaveTextContent("1");
});

test("selecionar duas linhas mostra a soma dos saldos na barra de seleção", async () => {
  montar();
  fireEvent.click(await screen.findByRole("checkbox", { name: "Selecionar K7X2PQ" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar DCL-88213" }));
  expect(screen.getByText("2 selecionadas · R$ 1.920,00 · lote só para valor igual ao esperado")).toBeInTheDocument();
});

test("Marcar recebidas abre o modal de lote com as reservas selecionadas", async () => {
  montar();
  await screen.findAllByText("Carlos Mendes · Lisboa");
  expect(screen.getByRole("button", { name: "Marcar recebidas" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar K7X2PQ" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar DCL-88213" }));
  fireEvent.click(screen.getByRole("button", { name: "Marcar recebidas" }));
  const dialogo = screen.getByRole("dialog");
  expect(within(dialogo).getByRole("heading", { name: "Marcar 2 comissões como recebidas" })).toBeInTheDocument();
  expect(within(dialogo).getByRole("button", { name: "Confirmar R$ 1.920,00" })).toBeInTheDocument();
});

test("Receber abre o modal individual com o esperado da reserva", async () => {
  montar();
  await screen.findByText("Família Oliveira · Gramado");
  fireEvent.click(within(linha("Família Oliveira")).getByRole("button", { name: "Receber" }));
  const dialogo = screen.getByRole("dialog");
  expect(within(dialogo).getByRole("heading", { name: "Receber comissão · CVC · CVC-77A2Q" })).toBeInTheDocument();
  expect(within(dialogo).getByText(/Esperado R\$ 740,00/)).toBeInTheDocument();
});

test("linha parcial oferece Receber saldo", async () => {
  montar();
  await screen.findByText("Marcos e Renata Lima · Noronha");
  expect(within(linha("Marcos e Renata Lima")).getByRole("button", { name: "Receber saldo" })).toBeInTheDocument();
});

test("a linha parcial não é elegível para lote e não tem checkbox", async () => {
  montar();
  await screen.findByText("Marcos e Renata Lima · Noronha");
  expect(within(linha("Marcos e Renata Lima")).queryByRole("checkbox")).toBeNull();
});

test("contador (só financeiro.ver_dre) não vê Receber nem a barra de seleção", async () => {
  montar((p) => p === "financeiro.ver_dre");
  await screen.findByText("Família Oliveira · Gramado");
  expect(screen.queryByRole("button", { name: "Receber" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Marcar recebidas" })).toBeNull();
  expect(screen.queryByRole("checkbox")).toBeNull();
});

test("clicar no KPI de atrasadas troca para a aba Atrasadas", async () => {
  montar();
  fireEvent.click(await screen.findByRole("button", { name: "3 reservas · pior: 41 dias →" }));
  expect(screen.getByRole("tab", { name: /Atrasadas/ })).toHaveAttribute("aria-selected", "true");
});

test("aba de divergências troca Situação por Motivo", async () => {
  montar(() => true, "/financeiro?aba=divergencias");
  expect(await screen.findByRole("columnheader", { name: "Motivo" })).toBeInTheDocument();
  expect(screen.queryByRole("columnheader", { name: "Situação" })).toBeNull();
});

test("em divergências a linha inteira leva à viagem", async () => {
  montar(() => true, "/financeiro?aba=divergencias");
  fireEvent.click(await screen.findByText("Família Oliveira · Gramado"));
  expect(await screen.findByText("Detalhe da viagem")).toBeInTheDocument();
});

test("aba recebidas troca Previsto por Recebido em", async () => {
  montar(() => true, "/financeiro?aba=recebidas");
  expect(await screen.findByRole("columnheader", { name: "Recebido em" })).toBeInTheDocument();
});
