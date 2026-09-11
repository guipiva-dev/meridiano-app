import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { AgendaDto } from "@/api/agenda";
import type { PendenciaDto } from "@/api/pendencias";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { AgendaPage } from "./AgendaPage";

function pendencia(over: Partial<PendenciaDto> = {}): PendenciaDto {
  return {
    id: "p1",
    versao: "1",
    titulo: "Pendência",
    descricao: null,
    dataPrevista: "2026-04-07",
    responsavelId: "u1",
    responsavelNome: "Guilherme",
    clienteId: null,
    clienteNome: null,
    viagemId: null,
    codigoViagem: null,
    status: "aberta",
    origem: "manual",
    prioridade: "normal",
    adiadaDe: null,
    concluidaEm: null,
    atrasada: false,
    ...over,
  };
}

// Cenário do protótipo (docs/design/prototipo-v1.html, tela Agenda): 2 atrasadas, 3 hoje, 2 semana,
// 2 embarques, 1 retorno, 3 documentos, 1 crédito.
const AGENDA: AgendaDto = {
  cabecalho: { hoje: "2026-04-07", pendenciasHoje: 3, atrasadas: 2, embarquesSemana: 2 },
  pendencias: {
    atrasadas: [
      pendencia({ id: "p1", titulo: "Retomar contato", clienteNome: "Roberto Tanaka", atrasada: true }),
      pendencia({ id: "p2", titulo: "Cobrar comissão CVC-77A2Q", codigoViagem: "VG-2026-0038", atrasada: true }),
    ],
    hoje: [
      pendencia({ id: "p3", titulo: "Confirmar seguro com Decolar", status: "concluida" }),
      pendencia({ id: "p4", titulo: "Renovar passaporte", clienteNome: "Lúcia Mendes", prioridade: "urgente" }),
      pendencia({ id: "p5", titulo: "Enviar voucher do hotel", clienteNome: "Ana Beatriz Souza" }),
    ],
    semana: [
      pendencia({ id: "p6", titulo: "Check-in e envio de documentos", codigoViagem: "VG-2026-0041" }),
      pendencia({ id: "p7", titulo: "Pós-viagem: avaliação e fotos", codigoViagem: "VG-2026-0038" }),
    ],
    total: 7,
  },
  embarques: [
    {
      viagemId: "v1",
      codigo: "VG-2026-0041",
      titular: "Ana Beatriz Souza",
      destino: "Cancún",
      dataIda: "2026-04-12",
      numPax: 2,
      faseOperacional: "confirmada",
    },
    {
      viagemId: "v2",
      codigo: "VG-2026-0042",
      titular: "Carlos Mendes",
      destino: "Lisboa",
      dataIda: "2026-04-18",
      numPax: 2,
      faseOperacional: "em_emissao",
    },
  ],
  retornos: [
    {
      viagemId: "v3",
      codigo: "VG-2026-0035",
      titular: "Marcos Lima",
      destino: "Noronha",
      dataVolta: "2026-04-08",
      posViagemEm: "2026-04-11",
    },
  ],
  documentos: [
    {
      clienteId: "c1",
      clienteNome: "Lúcia Mendes",
      tipo: "passaporte",
      numero: "GB998877",
      validade: "2026-05-30",
      diasParaVencer: 32,
      proximaViagemId: "v2",
      proximaViagemDestino: "Lisboa",
      proximaViagemIda: "2026-04-18",
      situacao: "na_agenda",
      pendenciaId: "p4",
    },
    {
      clienteId: "c2",
      clienteNome: "Pedro Mendes",
      tipo: "passaporte",
      numero: "GB998901",
      validade: "2026-08-02",
      diasParaVencer: 117,
      proximaViagemId: null,
      proximaViagemDestino: null,
      proximaViagemIda: null,
      situacao: "na_agenda",
      pendenciaId: null,
    },
    {
      clienteId: "c3",
      clienteNome: "Roberto Tanaka",
      tipo: "passaporte",
      numero: null,
      validade: null,
      diasParaVencer: null,
      proximaViagemId: null,
      proximaViagemDestino: null,
      proximaViagemIda: null,
      situacao: "so_cadastro",
      pendenciaId: null,
    },
  ],
  creditos: [
    {
      creditoId: "cr1",
      clienteId: "c4",
      clienteNome: "Patrícia Nunes",
      fornecedorNome: "Porto Seguro Viagens",
      origem: "cancelamento · PG-5521",
      viagemOrigemId: null,
      validade: "2027-02-28",
      diasParaVencer: 300,
      valor: 5100,
    },
  ],
  responsaveis: [
    { id: "u1", nome: "Guilherme" },
    { id: "u2", nome: "Ana Paula" },
  ],
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
    me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Guilherme", permissoes: [] },
    carregando: false,
    pode,
    entrar: () => Promise.resolve(),
    sair: () => Promise.resolve(),
    recarregar: () => Promise.resolve(),
  };
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/agenda", element: <AgendaPage /> }], {
    initialEntries: ["/agenda"],
  });
  render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

const chamadas: { url: string; method: string; body: unknown }[] = [];

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    if (url.includes("/agenda/badges"))
      return Promise.resolve(resposta(200, { agenda: 0, financeiro: null, clientes: null }));
    if (url.includes("/agenda")) return Promise.resolve(resposta(200, AGENDA));
    if (url.includes("/concluir")) return Promise.resolve(resposta(200, AGENDA.pendencias.atrasadas[0]));
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renderiza o subtítulo com as contagens do cabeçalho", async () => {
  montar();
  expect(await screen.findByText(/3 pendências hoje · 2 atrasadas · 2 embarques esta semana/)).toBeInTheDocument();
});

test("tab Pendências mostra as três seções com contadores", async () => {
  montar();
  expect(await screen.findByText("Atrasadas 2")).toBeInTheDocument();
  expect(screen.getByText("Hoje 3")).toBeInTheDocument();
  expect(screen.getByText("Esta semana 2")).toBeInTheDocument();
});

test("troca para 'Embarques e retornos' mostra Ana Beatriz Souza e Retornos", async () => {
  montar();
  await screen.findByText("Atrasadas 2");
  fireEvent.click(screen.getByRole("tab", { name: /Embarques e retornos/ }));
  expect(await screen.findByText("Ana Beatriz Souza")).toBeInTheDocument();
  expect(screen.getByText("Retornos")).toBeInTheDocument();
});

test("'Documentos vencendo' mostra Passaporte não cadastrado e chip 'só no cadastro'", async () => {
  montar();
  await screen.findByText("Atrasadas 2");
  fireEvent.click(screen.getByRole("tab", { name: /Documentos vencendo/ }));
  expect(await screen.findByText("Passaporte não cadastrado")).toBeInTheDocument();
  expect(screen.getByText("só no cadastro")).toBeInTheDocument();
});

test("'Créditos vencendo' mostra R$ 5.100,00", async () => {
  montar();
  await screen.findByText("Atrasadas 2");
  fireEvent.click(screen.getByRole("tab", { name: /Créditos vencendo/ }));
  expect(await screen.findByText("R$ 5.100,00")).toBeInTheDocument();
});

test("selecionar responsável refaz a query com ?responsavelId=", async () => {
  montar();
  await screen.findByText("Atrasadas 2");
  fireEvent.change(screen.getByLabelText(/Responsável/), { target: { value: "u2" } });
  await waitFor(() => {
    expect(chamadas.some((c) => c.url.includes("/agenda?responsavelId=u2"))).toBe(true);
  });
});

test("'+ Nova pendência' some sem viagem.editar", async () => {
  montar(() => false);
  await screen.findByText("Atrasadas 2");
  expect(screen.queryByRole("button", { name: "+ Nova pendência" })).toBeNull();
});

test("concluir chama POST /pendencias/{id}/concluir e invalida", async () => {
  montar();
  await screen.findByText("Atrasadas 2");
  const linha = screen.getByText("Retomar contato — Roberto Tanaka").closest("div")!.parentElement!;
  fireEvent.click(within(linha).getByRole("button", { name: "✓ Concluir" }));

  await waitFor(() => {
    const c = chamadas.find((x) => x.url.includes("/pendencias/p1/concluir"));
    expect(c?.method).toBe("POST");
  });
});
