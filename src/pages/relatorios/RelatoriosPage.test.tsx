import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { RelatorioResumoDto } from "@/api/relatorios";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { RelatoriosPage } from "./RelatoriosPage";

vi.mock("@/lib/download");

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Relatórios).
function dto(over: Partial<RelatorioResumoDto> = {}): RelatorioResumoDto {
  return {
    ano: 2026,
    anos: [2026, 2025],
    vendedorId: null,
    ate: "abril",
    kpis: {
      vendaAno: 187400,
      reservas: 62,
      viagens: 41,
      receitaRecebida: 27630,
      receitaPrevista: 24180,
      recebidoDeAnosAnteriores: 6100,
      despesasPagas: 9840,
      despesasFixas: 5800,
      despesasViagens: 1200,
      resultadoOperacional: 17790,
      margemOperacionalPct: 9.5,
      margemComercialPct: 12.9,
    },
    tetoMei: { receitaAno: 27630, teto: 81000, percentualTeto: 34, alerta: false },
    receitaPorMes: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, prevista: 70, recebida: 60 })),
    nacionalInternacional: [
      { tipo: "internacional", venda: 131200, pct: 70, margemPct: 13.4 },
      { tipo: "nacional", venda: 56200, pct: 30, margemPct: 11.6 },
    ],
    fornecedores: [
      { fornecedorId: "f1", nome: "CVC Operadora", reservas: 24, volume: 98100, receita: 12400, margemPct: 12.6 },
      { fornecedorId: "f2", nome: "Decolar", reservas: 11, volume: 31700, receita: 3050, margemPct: 9.6 },
    ],
    servicos: [
      { tipo: "aereo", reservas: 48 },
      { tipo: "hospedagem", reservas: 44 },
      { tipo: "seguro", reservas: 31 },
      { tipo: "traslado", reservas: 19 },
      { tipo: "passeio", reservas: 14 },
      { tipo: "ingresso", reservas: 0 },
      { tipo: "aluguel_carro", reservas: 0 },
      { tipo: "documentacao", reservas: 0 },
      { tipo: "outro", reservas: 0 },
    ],
    vendedores: [
      { id: "v1", nome: "Ana Paula Ribeiro" },
      { id: "v2", nome: "Marcos Castro" },
    ],
    ...over,
  };
}

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function montar() {
  const auth: AuthValue = {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
    carregando: false,
    pode: () => true,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/relatorios", element: <RelatoriosPage /> }], {
    initialEntries: ["/relatorios"],
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
let respostaAtual: RelatorioResumoDto;
beforeEach(() => {
  ultimaUrl = "";
  respostaAtual = dto();
  vi.stubGlobal("fetch", (url: string) => {
    ultimaUrl = url;
    if (url.includes("/relatorios/resumo")) return Promise.resolve(resposta(200, respostaAtual));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("mostra os seis KPIs do ano", async () => {
  montar();
  expect(await screen.findByText("R$ 187.400,00")).toBeInTheDocument();
  expect(screen.getByText("62 reservas · 41 viagens")).toBeInTheDocument();
  expect(screen.getByText(/inclui R\$ 6\.100,00 de 2025/)).toBeInTheDocument();
  expect(screen.getByText("9,5 %")).toBeInTheDocument();
  expect(screen.getByText("34 %")).toBeInTheDocument();
});

test("mostra a tabela de fornecedores com receita e margem", async () => {
  montar();
  expect(await screen.findByText("CVC Operadora")).toBeInTheDocument();
  expect(screen.getByText("12,6 %")).toBeInTheDocument();
});

test("mostra as barras de serviços vendidos", async () => {
  montar();
  expect(await screen.findByText("Aéreo")).toBeInTheDocument();
  expect(screen.getByText("48")).toBeInTheDocument();
});

test("trocar o ano refaz a busca com ?ano=", async () => {
  montar();
  await screen.findByText("R$ 187.400,00");
  fireEvent.change(screen.getByLabelText("Ano"), { target: { value: "2025" } });
  await waitFor(() => {
    expect(ultimaUrl).toContain("ano=2025");
  });
});

test("trocar o vendedor refaz a busca com vendedorId", async () => {
  montar();
  await screen.findByText("R$ 187.400,00");
  fireEvent.change(screen.getByLabelText("Vendedor"), { target: { value: "v1" } });
  await waitFor(() => {
    expect(ultimaUrl).toContain("vendedorId=v1");
  });
});

test("Exportar CSV baixa o csv do ano e vendedor atuais", async () => {
  const { baixar } = await import("@/lib/download");
  montar();
  await screen.findByText("R$ 187.400,00");
  fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
  expect(baixar).toHaveBeenCalledWith("/api/v1/relatorios/csv?ano=2026", "relatorio-2026.csv");
});

test("teto MEI em alerta mostra tone de aviso", async () => {
  respostaAtual = dto({ tetoMei: { receitaAno: 65000, teto: 81000, percentualTeto: 80, alerta: true } });
  montar();
  expect(await screen.findByText("80 %")).toBeInTheDocument();
});

test("sem movimentos no ano mostra o card sem teto", async () => {
  respostaAtual = dto({ tetoMei: null });
  montar();
  expect(await screen.findByText("Sem movimentos no ano")).toBeInTheDocument();
});
