import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { ToastHost } from "@/components/feedback";
import { DespesasPage } from "./DespesasPage";

function item(over: Record<string, unknown>) {
  return {
    id: "d0",
    versao: "1",
    descricao: "Despesa",
    categoria: "outro",
    valor: 0,
    vencimento: "2026-04-01",
    pago: false,
    pagoEm: null,
    formaPagamento: null,
    recorrente: false,
    recorrenciaAte: null,
    recorrenciaOrigemId: null,
    viagemId: null,
    codigoViagem: null,
    tituloViagem: null,
    fornecedorId: null,
    fornecedorNome: null,
    observacao: null,
    situacao: "a_pagar",
    ...over,
  };
}

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Financeiro · Despesas).
const DESPESAS = {
  itens: [
    item({
      id: "d1",
      descricao: "DAS — MEI abril",
      categoria: "imposto",
      valor: 75.9,
      vencimento: "2026-04-20",
      recorrente: true,
      situacao: "a_pagar",
    }),
    item({
      id: "d2",
      descricao: "Sistema Meridiano",
      categoria: "fixo",
      valor: 149,
      vencimento: "2026-04-10",
      recorrente: true,
      situacao: "a_pagar",
    }),
    item({
      id: "d3",
      descricao: "Anúncios Instagram — abril",
      categoria: "marketing",
      valor: 955.1,
      vencimento: "2026-04-15",
      fornecedorNome: "Meta Ads",
      situacao: "vencida",
    }),
    item({
      id: "d4",
      descricao: "Motorista para aeroporto",
      categoria: "operacional",
      valor: 180,
      vencimento: "2026-04-12",
      pago: true,
      pagoEm: "2026-04-05",
      formaPagamento: "pix",
      viagemId: "v42",
      codigoViagem: "VG-2026-0042",
      tituloViagem: "Carlos Mendes · Lisboa",
      situacao: "paga",
    }),
    item({
      id: "d5",
      descricao: "Telefone e internet",
      categoria: "fixo",
      valor: 230,
      vencimento: "2026-04-05",
      pago: true,
      pagoEm: "2026-04-05",
      formaPagamento: "boleto",
      recorrente: true,
      situacao: "paga",
    }),
    item({
      id: "d6",
      descricao: "Pró-labore — Guilherme",
      categoria: "fixo",
      valor: 1050,
      vencimento: "2026-04-01",
      pago: true,
      pagoEm: "2026-04-01",
      formaPagamento: "transferencia",
      recorrente: true,
      situacao: "paga",
    }),
  ],
  total: 9,
  pagina: 1,
  tamanho: 25,
  mes: "2026-04",
  kpis: {
    lancadoValor: 2640,
    lancadoQtd: 9,
    aPagarValor: 1180,
    vencidas: 1,
    vencemAte7Dias: 2,
    fixosValor: 1460,
    ligadasViagemValor: 180,
    ligadasViagemQtd: 1,
  },
};

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function stubFetchPadrao(extra?: (url: string) => Response | undefined) {
  vi.stubGlobal("fetch", (url: string) => {
    const resp = extra?.(url);
    if (resp) return Promise.resolve(resp);
    if (url.includes("/despesas?")) return Promise.resolve(resposta(200, DESPESAS));
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
  const router = createMemoryRouter([{ path: "/financeiro/despesas", element: <DespesasPage /> }], {
    initialEntries: ["/financeiro/despesas"],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
      <ToastHost />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  stubFetchPadrao();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Linha da tabela pela descrição da despesa. */
function linha(descricao: string) {
  return screen.getByRole("row", { name: new RegExp(descricao) });
}

test("mostra os KPIs do protótipo no cabeçalho e nos cartões", async () => {
  montar();
  expect(await screen.findByText(/R\$ 2\.640,00 lançados/)).toBeInTheDocument();
  expect(screen.getByText(/R\$ 1\.180,00 a pagar/)).toBeInTheDocument();
  expect(screen.getByText("9 despesas")).toBeInTheDocument();
  const valorApagar = screen.getByText("R$ 1.180,00");
  expect(valorApagar.closest("div")).toHaveClass("warning");
  expect(screen.getByText("R$ 1.460,00")).toBeInTheDocument();
  const cardLigadas = screen.getByText("Ligadas a viagens").closest("div");
  expect(within(cardLigadas as HTMLElement).getByText("R$ 180,00")).toBeInTheDocument();
});

test("Marcar pago abre o modal de pagamento com o título da despesa", async () => {
  montar();
  await screen.findByText("Anúncios Instagram — abril");
  fireEvent.click(within(linha("Anúncios Instagram — abril")).getByRole("button", { name: "Marcar pago" }));
  const dialogo = screen.getByRole("dialog");
  expect(
    within(dialogo).getByRole("heading", { name: "Marcar paga · Anúncios Instagram — abril" }),
  ).toBeInTheDocument();
});

test("+ Nova despesa abre o modal de nova despesa", async () => {
  montar();
  fireEvent.click(await screen.findByRole("button", { name: "+ Nova despesa" }));
  const dialogo = screen.getByRole("dialog");
  expect(within(dialogo).getByRole("heading", { name: "Nova despesa" })).toBeInTheDocument();
});

test("trocar o mês refaz a busca com o novo mês", async () => {
  const chamadas: string[] = [];
  stubFetchPadrao((url) => {
    if (url.includes("/despesas?")) chamadas.push(url);
    return undefined;
  });
  montar();
  await screen.findByText("Anúncios Instagram — abril");
  fireEvent.change(screen.getByLabelText("Mês"), { target: { value: "2026-05" } });
  await waitFor(() => {
    expect(chamadas.some((u) => u.includes("mes=2026-05"))).toBe(true);
  });
});

test("pagar despesa recorrente mostra o toast da próxima ocorrência", async () => {
  stubFetchPadrao((url) => {
    if (url.includes("/pagar")) {
      return resposta(200, {
        despesa: { ...DESPESAS.itens[1], pago: true, pagoEm: "2026-04-10" },
        proxima: { ...DESPESAS.itens[1], id: "d2b", vencimento: "2026-05-10" },
      });
    }
    return undefined;
  });
  montar();
  await screen.findByText("Sistema Meridiano");
  fireEvent.click(within(linha("Sistema Meridiano")).getByRole("button", { name: "Marcar pago" }));
  const dialogo = screen.getByRole("dialog");
  fireEvent.change(within(dialogo).getByLabelText(/Forma de pagamento/), { target: { value: "pix" } });
  fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar pagamento" }));
  expect(await screen.findByText(/Próxima criada para/)).toBeInTheDocument();
});
