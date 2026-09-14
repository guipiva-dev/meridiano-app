import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { MovimentoDto } from "@/api/financeiro";
import { chaves, type ViagemDto } from "@/api/viagens";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { FinanceiroTab } from "./FinanceiroTab";
import { RESERVA_1, RESERVA_2, VIAGEM } from "./fixtures";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const MOVIMENTO: MovimentoDto = {
  id: "m1",
  versao: "1",
  reservaId: "r1",
  viagemId: "v1",
  codigoViagem: "VG-2026-0042",
  localizador: "K7X2PQ",
  fornecedorNome: "CVC Operadora",
  tipo: "recebimento_operadora",
  valor: 1100,
  dataMovimento: "2026-04-20",
  formaPagamento: "pix",
  observacao: null,
  criadoPorNome: "Ana Paula",
  criadoEm: "2026-04-20T12:00:00Z",
};

const DESPESA = {
  id: "d1",
  versao: "1",
  descricao: "Motorista para aeroporto",
  categoria: "operacional",
  valor: 180,
  vencimento: "2026-04-12",
  pago: false,
  pagoEm: null,
  formaPagamento: null,
  recorrente: false,
  recorrenciaAte: null,
  recorrenciaOrigemId: null,
  viagemId: "v1",
  codigoViagem: "VG-2026-0042",
  tituloViagem: null,
  fornecedorId: null,
  fornecedorNome: null,
  observacao: null,
  situacao: "a_pagar",
};

function stubFetch(extra?: (url: string, init?: RequestInit) => Response | undefined) {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const resp = extra?.(url, init);
    if (resp) return Promise.resolve(resp);
    if (url.includes("/viagens/v1/movimentos")) return Promise.resolve(resposta(200, [MOVIMENTO]));
    if (url.includes("/despesas?")) {
      return Promise.resolve(
        resposta(200, { itens: [DESPESA], total: 1, pagina: 1, tamanho: 25, mes: null, kpis: {} }),
      );
    }
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, []));
    return Promise.resolve(resposta(200, null));
  });
}

function montar(pode: (p: string) => boolean = () => true, viagem: ViagemDto = VIAGEM) {
  const auth: AuthValue = {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <FinanceiroTab viagem={viagem} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return qc;
}

beforeEach(() => {
  stubFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("mostra Receber nas duas reservas a receber quando pode financeiro.movimentar", async () => {
  montar();
  expect(await screen.findAllByRole("button", { name: "Receber" })).toHaveLength(2);
});

test("esconde Receber para quem não pode movimentar (ex.: contador)", async () => {
  montar(() => false);
  await screen.findByText("CVC Operadora");
  expect(screen.queryByRole("button", { name: "Receber" })).toBeNull();
});

test("bloco Movimentos lista o recebimento", async () => {
  montar();
  expect(await screen.findByText("R$ 1.100,00")).toBeInTheDocument();
});

test("+ Lançar movimento abre o MovimentoModal com as 2 reservas no Select", async () => {
  montar();
  fireEvent.click(await screen.findByRole("button", { name: "+ Lançar movimento" }));
  const dialogo = screen.getByRole("dialog");
  const select = within(dialogo).getByLabelText(/^Reserva/);
  expect(within(select).getAllByRole("option")).toHaveLength(2);
});

test("bloco Despesas lista a despesa ligada à viagem", async () => {
  montar();
  expect(await screen.findByText("R$ 180,00")).toBeInTheDocument();
});

test("confirmar o recebimento invalida a viagem no cache", async () => {
  const qc = montar();
  const invalidar = vi.spyOn(qc, "invalidateQueries");
  await screen.findAllByRole("button", { name: "Receber" });
  stubFetch((url, init) => {
    if (url === "/api/v1/movimentos" && init?.method === "POST") return resposta(201, MOVIMENTO);
    return undefined;
  });
  fireEvent.click(screen.getAllByRole("button", { name: "Receber" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar recebimento" }));
  await waitFor(() => {
    expect(
      invalidar.mock.calls.some(
        (c) => JSON.stringify((c[0] as { queryKey: unknown[] }).queryKey) === JSON.stringify(chaves.viagem("v1")),
      ),
    ).toBe(true);
  });
});

test("faixa: Receita da agência, Receita recebida (movimentos) e Comissão do vendedor, sem 'Comissões recebidas'", async () => {
  montar();
  await screen.findByText("CVC Operadora");
  expect(screen.getByText("Receita da agência")).toBeInTheDocument();
  expect(screen.getByText("Receita recebida")).toBeInTheDocument();
  expect(screen.getByRole("tooltip")).toHaveTextContent(/Comissões, RAV e taxas que já entraram/);
  expect(screen.getByText("Comissão do vendedor")).toBeInTheDocument();
  // faixa + título do bloco Despesas
  expect(screen.getAllByText("Despesas da viagem")).toHaveLength(2);
  expect(screen.getByText("Resultado da viagem")).toBeInTheDocument();
  expect(screen.queryByText(/Comissões recebidas|vendedora/)).toBeNull();
});

test("movimento sem localizador identifica a reserva pelo fornecedor", async () => {
  stubFetch((url) =>
    url.includes("/viagens/v1/movimentos") ? resposta(200, [{ ...MOVIMENTO, localizador: null }]) : undefined,
  );
  montar();
  expect(await screen.findByText(/reserva CVC Operadora/)).toBeInTheDocument();
  expect(screen.queryByText(/reserva —/)).toBeNull();
});

test("Excluir… fica visível ao lado de Editar e abre o modal com motivo obrigatório", async () => {
  montar();
  await screen.findByText("R$ 1.100,00");
  // primeiro Excluir… é o do movimento (bloco Movimentos vem antes de Despesas)
  fireEvent.click(screen.getAllByRole("button", { name: "Excluir…" })[0]!);
  const dialogo = await screen.findByRole("dialog");
  expect(dialogo).toHaveTextContent("Excluir movimento");
  fireEvent.click(within(dialogo).getByRole("button", { name: "Excluir movimento" }));
  expect(await within(dialogo).findByText("Motivo é obrigatório")).toBeInTheDocument();
});

test("A07/A38: comissão divergente vai para 'Comissões recebidas', sem botão Receber", async () => {
  montar(() => true, {
    ...VIAGEM,
    reservas: [RESERVA_1, { ...RESERVA_2, situacaoComissao: "divergente", recebidoOperadora: 250 }],
  });
  await screen.findByText("Decolar");
  expect(screen.getByText("Comissões recebidas")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Receber" })).toHaveLength(1);
});

test("A38: comissão recebida some de 'Comissões a receber' e não tem botão Receber", async () => {
  montar(() => true, {
    ...VIAGEM,
    reservas: [RESERVA_1, { ...RESERVA_2, situacaoComissao: "recebida", recebidoOperadora: 300 }],
  });
  await screen.findByText("Decolar");
  expect(screen.getAllByRole("button", { name: "Receber" })).toHaveLength(1);
});

test("A38: comissão parcial mostra 'recebido R$ X · falta R$ Y'", async () => {
  montar(() => true, {
    ...VIAGEM,
    reservas: [{ ...RESERVA_1, situacaoComissao: "parcial", recebidoOperadora: 400 }, RESERVA_2],
  });
  expect(await screen.findByText("recebido R$ 400,00 · falta R$ 600,00")).toBeInTheDocument();
});

test("viagem cancelada: sem + Despesa; Lançar movimento só oferece estorno e reembolso", async () => {
  montar(() => true, {
    ...VIAGEM,
    cancelada: true,
    faseOperacional: "cancelada",
    reservas: VIAGEM.reservas.map((r) => ({ ...r, status: "cancelada" as const })),
  });
  await screen.findByText("R$ 1.100,00");
  expect(screen.queryByRole("button", { name: "+ Despesa" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "+ Lançar movimento" }));
  const dialogo = screen.getByRole("dialog");
  const tipo = within(dialogo).getByLabelText(/^Tipo/);
  expect(
    within(tipo)
      .getAllByRole("option")
      .map((o) => o.textContent),
  ).toEqual(["Estorno da operadora", "Reembolso ao cliente"]);
  // as reservas canceladas continuam elegíveis para estorno/reembolso
  expect(within(within(dialogo).getByLabelText(/^Reserva/)).getAllByRole("option")).toHaveLength(2);
});
