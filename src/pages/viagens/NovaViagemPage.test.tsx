import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthValue } from "@/auth/AuthProvider";
import { reservaVazia } from "@/components/reserva";
import { NovaViagemPage } from "./NovaViagemPage";

const FORNECEDORES = [
  { id: "f1", nome: "CVC", tipo: "operadora", percentualComissaoPadrao: 10, prazoComissaoDias: 30, ativo: true },
];
const VENDEDORES = [{ id: "u1", nome: "Ana", perfil: "dono", geraRepasse: false, percentualPadrao: 0 }];
const AGENCIA = { nome: "Viva", taxaServicoPadrao: 50 };

const urls: string[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const auth: AuthValue = {
  me: { usuarioId: "u1", agenciaId: "a1", perfil: "dono", nome: "Ana", permissoes: [] },
  carregando: false,
  pode: () => true,
  entrar: () => Promise.resolve(),
  sair: () => Promise.resolve(),
  recarregar: () => Promise.resolve(),
};

function viagemEdicao() {
  return {
    id: "v9",
    codigo: "VG-2026-0042",
    versao: "7",
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: null,
    dataVolta: null,
    vendedorId: "u1",
    vendedorNome: "Ana",
    agenteId: "u1",
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    faseOperacional: "sem_reserva",
    faseFinanceira: "nao_prevista",
    passageiros: [{ clienteId: "c1", nome: "Carlos", titular: true }],
    reservas: [],
  };
}

function montar(entrada = "/viagens/nova") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/viagens", element: <p>Lista de viagens</p> },
      { path: "/viagens/nova", element: <NovaViagemPage /> },
      { path: "/viagens/:id/editar", element: <NovaViagemPage /> },
      { path: "/viagens/:id", element: <p>Detalhe da viagem</p> },
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
  urls.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    urls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (/\/viagens\/[^/?]+$/.test(url)) {
      return Promise.resolve(resposta(500, { codigo: "erro", detail: "Falha ao carregar a viagem" }));
    }
    return Promise.resolve(resposta(200, null));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renderiza o cabeçalho, a seção de dados e o botão de adicionar reserva", async () => {
  montar();
  expect(await screen.findByRole("heading", { name: /Nova viagem/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Dados da viagem" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+ Adicionar reserva" })).toBeInTheDocument();
});

test("Ctrl+Enter adiciona um card de reserva", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });
  expect(screen.queryByRole("region", { name: /Reserva 1/ })).toBeNull();

  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });

  expect(await screen.findByRole("region", { name: /Reserva 1/ })).toBeInTheDocument();
});

test("Ctrl+S sem passageiros mostra erro no campo Passageiros e não chama a API", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });

  fireEvent.keyDown(window, { key: "s", ctrlKey: true });

  await waitFor(() => {
    expect(screen.getByText("Adicione ao menos um passageiro")).toBeInTheDocument();
  });
  expect(urls.some((u) => u.startsWith("POST"))).toBe(false);
});

test("falha ao carregar a viagem mostra o erro no topo e sai do esqueleto", async () => {
  montar("/viagens/v9/editar");
  expect(await screen.findByText("Falha ao carregar a viagem")).toBeInTheDocument();
  expect(screen.queryByLabelText("Carregando")).toBeNull();
  expect(screen.getByRole("heading", { name: /Nova viagem/ })).toBeInTheDocument();
});

test("ALT-01: salvar com reserva sem fornecedor não chama a API e mostra o erro no campo", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });

  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  await screen.findByRole("region", { name: /Reserva 1/ });

  fireEvent.click(screen.getByRole("button", { name: "Salvar viagem" }));

  expect(await screen.findByText("Escolha o fornecedor")).toBeInTheDocument();
  expect(urls.some((u) => u.startsWith("POST"))).toBe(false);
});

test("ALT-01: com duas reservas, só a que está sem fornecedor mostra o erro após salvar", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });

  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  await screen.findByRole("region", { name: /Reserva 1/ });
  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  const reserva2 = await screen.findByRole("region", { name: /Reserva 2/ });
  fireEvent.change(within(reserva2).getByLabelText("Fornecedor"), { target: { value: "f1" } });

  fireEvent.click(screen.getByRole("button", { name: "Salvar viagem" }));

  expect(await screen.findAllByText("Escolha o fornecedor")).toHaveLength(1);
  expect(within(reserva2).queryByText("Escolha o fornecedor")).toBeNull();
});

test("ALT-01: erro do fornecedor some ao escolher o fornecedor na reserva que estava com erro", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });

  fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
  const reserva1 = await screen.findByRole("region", { name: /Reserva 1/ });
  fireEvent.click(screen.getByRole("button", { name: "Salvar viagem" }));
  await screen.findByText("Escolha o fornecedor");

  fireEvent.change(within(reserva1).getByLabelText("Fornecedor"), { target: { value: "f1" } });

  await waitFor(() => {
    expect(screen.queryByText("Escolha o fornecedor")).toBeNull();
  });
});

test("ALT-13: Fechar sem viagem existente navega para a lista de viagens", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });

  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

  expect(await screen.findByText("Lista de viagens")).toBeInTheDocument();
});

test("ALT-13: Fechar após salvar edição navega para a página da viagem, nunca nav(-1)", async () => {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? "GET";
    urls.push(`${metodo} ${url}`);
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (/\/viagens\/[^/?]+$/.test(url)) return Promise.resolve(resposta(200, viagemEdicao()));
    return Promise.resolve(resposta(200, null));
  });

  montar("/viagens/v9/editar");
  await screen.findByRole("heading", { name: /Lisboa/ });

  fireEvent.click(screen.getByRole("button", { name: "Salvar viagem" }));
  await waitFor(() => {
    expect(urls.some((u) => u.startsWith("PUT"))).toBe(true);
  });

  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

  expect(await screen.findByText("Detalhe da viagem")).toBeInTheDocument();
});

test("reservaVazia gera chaveLocal distinta a cada chamada (key estável do card sem id)", () => {
  expect(reservaVazia(0).chaveLocal).toBeTruthy();
  expect(reservaVazia(0).chaveLocal).not.toBe(reservaVazia(0).chaveLocal);
});

test("edição mostra '{titular} · {destino}' como título e 'Vendedor:' sem '(a)'", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (/\/viagens\/[^/?]+$/.test(url)) {
      return Promise.resolve(resposta(200, viagemEdicao()));
    }
    return Promise.resolve(resposta(200, null));
  });
  montar("/viagens/v9/editar");
  expect(await screen.findByRole("heading", { name: /^Carlos · Lisboa/ })).toBeInTheDocument();
  expect(screen.getByText(/Vendedor: Ana/)).toBeInTheDocument();
  expect(screen.queryByText(/Vendedor\(a\)/)).toBeNull();
});

test("A05: banner de viagem semelhante nunca aparece na edição, mesmo com semelhante encontrada", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (url.includes("/viagens/semelhantes")) {
      return Promise.resolve(
        resposta(200, [{ id: "vOutra", codigo: "VG-2026-0001", destino: "Lisboa", faseOperacional: "em_emissao" }]),
      );
    }
    if (/\/viagens\/[^/?]+$/.test(url)) return Promise.resolve(resposta(200, viagemEdicao()));
    return Promise.resolve(resposta(200, null));
  });
  montar("/viagens/v9/editar");
  await screen.findByRole("heading", { name: /Lisboa/ });
  await new Promise((r) => setTimeout(r, 450));
  expect(screen.queryByText(/Encontramos uma viagem semelhante/)).toBeNull();
});

test("rótulo 'Comissão do vendedor' no resumo", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });
  expect(screen.getByText("Comissão do vendedor")).toBeInTheDocument();
  expect(screen.queryByText(/vendedora/)).toBeNull();
});

test("destino tem maxLength 120", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });
  expect(screen.getByLabelText(/^Destino/)).toHaveAttribute("maxLength", "120");
});

test("observações tem maxLength 2000 e mostra contador N/2000", async () => {
  montar();
  await screen.findByRole("heading", { name: /Nova viagem/ });
  const observacoes = screen.getByLabelText("Observações");
  expect(observacoes).toHaveAttribute("maxLength", "2000");

  fireEvent.change(observacoes, { target: { value: "abc" } });

  expect(screen.getByText("3/2000")).toBeInTheDocument();
});

test("edição não repete 'Titular:' no subtítulo", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, FORNECEDORES));
    if (url.includes("/usuarios/vendedores")) return Promise.resolve(resposta(200, VENDEDORES));
    if (url.includes("/agencia")) return Promise.resolve(resposta(200, AGENCIA));
    if (/\/viagens\/[^/?]+$/.test(url)) return Promise.resolve(resposta(200, viagemEdicao()));
    return Promise.resolve(resposta(200, null));
  });
  montar("/viagens/v9/editar");
  await screen.findByRole("heading", { name: /^Carlos · Lisboa/ });
  expect(screen.queryByText(/Titular:/)).toBeNull();
});
