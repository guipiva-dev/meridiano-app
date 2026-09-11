import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { AuditoriaDto, EventoAuditoriaDto } from "@/api/auditoria";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { baixar } from "@/lib/download";
import { AuditoriaPage } from "./AuditoriaPage";

vi.mock("@/lib/download", () => ({ baixar: vi.fn() }));

function evento(over: Partial<EventoAuditoriaDto>): EventoAuditoriaDto {
  return {
    id: 1,
    tabela: "reserva",
    registroId: "r1",
    acao: "UPDATE",
    titulo: "Valores da reserva alterados",
    subtitulo: null,
    alteracoes: { valor_comissao: { de: 1000, para: 1100 } },
    motivo: "operadora revisou %",
    usuarioNome: "Guilherme",
    criadoEm: new Date().toISOString(),
    viagemId: "v1",
    codigoViagem: "VG-2026-0042",
    ...over,
  };
}

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Auditoria).
const EVENTOS: EventoAuditoriaDto[] = [
  evento({ id: 1 }),
  evento({
    id: 2,
    tabela: "log_acesso_documento",
    acao: "ACESSO",
    titulo: "Visualizou o passaporte de Lúcia Mendes",
    subtitulo: "documento sensível · LGPD",
    usuarioNome: "Ana Paula",
    alteracoes: {},
    motivo: null,
    viagemId: null,
    codigoViagem: null,
  }),
  evento({ id: 3, tabela: "viagem_reserva", titulo: "Emitiu a reserva DCL-88213", alteracoes: {} }),
  evento({ id: 4, tabela: "reserva", titulo: "Cancelou a reserva PG-5521", alteracoes: {} }),
  evento({ id: 5, tabela: "repasse", titulo: "Pagou repasse de R$ 470,00 a Marcos Castro", alteracoes: {} }),
  evento({ id: 6, tabela: "fechamento_periodo", titulo: "Fechou fevereiro de 2026", alteracoes: {} }),
  evento({ id: 7, tabela: "movimento_financeiro", titulo: "Registrou recebimento de R$ 600,00", alteracoes: {} }),
];

const RESPOSTA: AuditoriaDto = {
  itens: EVENTOS,
  total: 412,
  proximoAntesDe: "2026-03-05T09:15:00Z",
  proximoAntesDeId: 7,
  usuarios: [
    { id: "u1", nome: "Guilherme" },
    { id: "u2", nome: "Ana Paula" },
  ],
};

function resposta(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

let ultimaUrl = "";
function montar(caminho = "/auditoria") {
  const auth: AuthValue = {
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Guilherme", permissoes: [] },
    carregando: false,
    pode: () => true,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/auditoria", element: <AuditoriaPage /> }], {
    initialEntries: [caminho],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  ultimaUrl = "";
  vi.stubGlobal("fetch", (url: string) => {
    ultimaUrl = url;
    if (url.includes("/auditoria")) return Promise.resolve(resposta(RESPOSTA));
    return Promise.resolve(resposta(null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

test("renderiza os eventos do protótipo e o rodapé de paginação", async () => {
  montar();
  expect(await screen.findByText(/Guilherme — Valores da reserva alterados/)).toBeInTheDocument();
  expect(screen.getByText(/Ana Paula — Visualizou o passaporte de Lúcia Mendes/)).toBeInTheDocument();
  expect(screen.getByText("1–7 de 412")).toBeInTheDocument();
});

test("Mais antigas pede ?antesDe=&antesDeId= e acrescenta itens", async () => {
  montar();
  await screen.findByText("1–7 de 412");
  fireEvent.click(screen.getByRole("button", { name: "Mais antigas →" }));
  await waitFor(() => {
    expect(ultimaUrl).toContain(`antesDe=${encodeURIComponent(RESPOSTA.proximoAntesDe!)}`);
    expect(ultimaUrl).toContain("antesDeId=7");
  });
  await screen.findByText("1–14 de 412");
});

test("chip Recebimentos filtra por ?oque=recebimentos", async () => {
  montar();
  await screen.findByText("1–7 de 412");
  fireEvent.click(screen.getByRole("button", { name: "Recebimentos" }));
  await waitFor(() => {
    expect(ultimaUrl).toContain("oque=recebimentos");
  });
});

test("chip Ana Paula filtra por ?usuarioId=", async () => {
  montar();
  await screen.findByText("1–7 de 412");
  fireEvent.click(screen.getByRole("button", { name: "Ana Paula" }));
  await waitFor(() => {
    expect(ultimaUrl).toContain("usuarioId=u2");
  });
});

test("datas de/até filtram por ?de=&ate=", async () => {
  montar();
  await screen.findByText("1–7 de 412");
  fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-04-01" } });
  fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-04-07" } });
  await waitFor(() => {
    expect(ultimaUrl).toContain("de=2026-04-01");
    expect(ultimaUrl).toContain("ate=2026-04-07");
  });
});

test("Exportar CSV chama baixar com os filtros ativos", async () => {
  montar();
  await screen.findByText("1–7 de 412");
  fireEvent.click(screen.getByRole("button", { name: "Recebimentos" }));
  await waitFor(() => {
    expect(ultimaUrl).toContain("oque=recebimentos");
  });
  fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
  expect(baixar).toHaveBeenCalledWith("/api/v1/auditoria/csv?oque=recebimentos", "auditoria.csv");
});

test("proximoAntesDe null esconde o botão Mais antigas", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    ultimaUrl = url;
    return Promise.resolve(resposta({ ...RESPOSTA, proximoAntesDe: null, proximoAntesDeId: null }));
  });
  montar();
  await screen.findByText("1–7 de 412");
  expect(screen.queryByRole("button", { name: "Mais antigas →" })).toBeNull();
});

test("filtros vêm da URL", async () => {
  montar("/auditoria?oque=valores&de=2026-01-01");
  await screen.findByText("1–7 de 412");
  expect(ultimaUrl).toContain("oque=valores");
  expect(ultimaUrl).toContain("de=2026-01-01");
});
