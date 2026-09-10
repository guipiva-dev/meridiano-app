import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { MovimentoDto } from "@/api/financeiro";
import { chaves } from "@/api/viagens";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { FinanceiroTab } from "./FinanceiroTab";
import { VIAGEM } from "./fixtures";

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
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <FinanceiroTab viagem={VIAGEM} />
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
