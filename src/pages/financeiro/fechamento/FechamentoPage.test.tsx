import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { FechamentoPage } from "./FechamentoPage";

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Financeiro · Fechamento).
const PERIODOS_2026 = [
  {
    competencia: "2026-04",
    status: "aberto",
    reservas: 0,
    comissoesPendentes: 0,
    comissoesPendentesValor: 0,
    despesas: 0,
    receitaPrevista: 2120,
    receitaRecebida: 0,
    fechadoEm: null,
    fechadoPorNome: null,
    corrente: true,
  },
  {
    competencia: "2026-03",
    status: "pendencias",
    reservas: 22,
    comissoesPendentes: 3,
    comissoesPendentesValor: 3090,
    despesas: 8,
    receitaPrevista: 11940,
    receitaRecebida: 9150,
    fechadoEm: null,
    fechadoPorNome: null,
    corrente: false,
  },
  {
    competencia: "2026-02",
    status: "fechado",
    reservas: 18,
    comissoesPendentes: 0,
    comissoesPendentesValor: 0,
    despesas: 6,
    receitaPrevista: 8310,
    receitaRecebida: 8310,
    fechadoEm: "2026-03-05T12:00:00Z",
    fechadoPorNome: "Guilherme",
    corrente: false,
  },
  {
    competencia: "2026-01",
    status: "fechado",
    reservas: 15,
    comissoesPendentes: 0,
    comissoesPendentesValor: 0,
    despesas: 5,
    receitaPrevista: 6870,
    receitaRecebida: 6870,
    fechadoEm: "2026-02-04T12:00:00Z",
    fechadoPorNome: "Guilherme",
    corrente: false,
  },
];

const PENDENTES_MARCO = [
  {
    reservaId: "r1",
    viagemId: "v38",
    codigo: "VG-2026-0038",
    titular: "Família Oliveira",
    destino: "Gramado",
    localizador: "CVC-77A2Q",
    fornecedorId: "f1",
    fornecedorNome: "CVC",
    dataCompra: "2026-01-10",
    dataPrevistaComissao: "2026-02-20",
    situacaoComissao: "atrasada",
    diasAtraso: 41,
    esperado: 740,
    recebido: 0,
    saldo: 740,
    conciliacaoEncerrada: false,
    divergenciaMotivo: null,
    ultimoRecebimentoEm: null,
    elegivelLote: true,
  },
  {
    reservaId: "r2",
    viagemId: "v33",
    codigo: "VG-2026-0033",
    titular: "Roberto Tanaka",
    destino: "Orlando",
    localizador: "AZ-90213",
    fornecedorId: "f2",
    fornecedorNome: "Azul Viagens",
    dataCompra: "2026-01-05",
    dataPrevistaComissao: "2026-03-10",
    situacaoComissao: "atrasada",
    diasAtraso: 23,
    esperado: 2350,
    recebido: 0,
    saldo: 2350,
    conciliacaoEncerrada: false,
    divergenciaMotivo: null,
    ultimoRecebimentoEm: null,
    elegivelLote: true,
  },
  {
    reservaId: "r3",
    viagemId: "v40",
    codigo: "VG-2026-0040",
    titular: "Marcos e Renata Lima",
    destino: "Noronha",
    localizador: "DCL-71100",
    fornecedorId: "f3",
    fornecedorNome: "Decolar",
    dataCompra: "2026-01-20",
    dataPrevistaComissao: "2026-03-28",
    situacaoComissao: "parcial",
    diasAtraso: null,
    esperado: 100,
    recebido: 0,
    saldo: 0,
    conciliacaoEncerrada: false,
    divergenciaMotivo: null,
    ultimoRecebimentoEm: null,
    elegivelLote: false,
  },
];

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
  const router = createMemoryRouter([{ path: "/financeiro/fechamento", element: <FechamentoPage /> }], {
    initialEntries: ["/financeiro/fechamento"],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

const chamadas: string[] = [];

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string) => {
    chamadas.push(url);
    if (url.includes("/periodos/2026-03/pendentes")) return Promise.resolve(resposta(200, PENDENTES_MARCO));
    if (url.includes("/periodos?ano=")) return Promise.resolve(resposta(200, PERIODOS_2026));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function linha(mes: string) {
  return screen.getByText(mes).closest("div") as HTMLElement;
}

test("mês corrente mostra 'em andamento' sem botão de fechar", async () => {
  montar();
  await screen.findByText("Abril");
  expect(within(linha("Abril")).getByText("em andamento")).toBeInTheDocument();
  expect(within(linha("Abril")).queryByRole("button")).toBeNull();
});

test("mês com pendências mostra o badge e abre o modal de fechar com as pendentes carregadas", async () => {
  montar();
  await screen.findByText("Março");
  expect(within(linha("Março")).getByText("Pendências")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Fechar Março…" }));
  const dialogo = await screen.findByRole("dialog");
  expect(within(dialogo).getByRole("heading", { name: "Fechar Março de 2026?" })).toBeInTheDocument();
  expect(within(dialogo).getByText(/3 comissões/)).toBeInTheDocument();
  expect(chamadas.some((u) => u.includes("/periodos/2026-03/pendentes"))).toBe(true);
});

test("mês fechado mostra quem fechou e quando, e abre o modal de reabertura", async () => {
  montar();
  await screen.findByText("Fevereiro");
  expect(within(linha("Fevereiro")).getByText("fechado em 05/03 por Guilherme")).toBeInTheDocument();
  fireEvent.click(within(linha("Fevereiro")).getByRole("button", { name: "Reabrir…" }));
  const dialogo = await screen.findByRole("dialog");
  expect(within(dialogo).getByRole("heading", { name: "Reabrir Fevereiro de 2026?" })).toBeInTheDocument();
});

test("perfil sem financeiro.fechar_periodo não vê o botão Fechar", async () => {
  montar((p) => p !== "financeiro.fechar_periodo");
  await screen.findByText("Março");
  expect(screen.queryByRole("button", { name: /Fechar/ })).toBeNull();
});

test("perfil sem financeiro.editar_periodo_fechado não vê o botão Reabrir", async () => {
  montar((p) => p !== "financeiro.editar_periodo_fechado");
  await screen.findByText("Fevereiro");
  expect(screen.queryByRole("button", { name: /Reabrir/ })).toBeNull();
});

test("trocar o ano refaz a busca de períodos", async () => {
  montar();
  await screen.findByText("Março");
  fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "2025" } });
  await waitFor(() => {
    expect(chamadas.some((u) => u.includes("/periodos?ano=2025"))).toBe(true);
  });
});
