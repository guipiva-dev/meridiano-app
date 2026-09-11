import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ViagemDaPessoaDto } from "@/api/clientes";
import type { PendenciaDto } from "@/api/pendencias";
import { ListaPendencias } from "./ListaPendencias";

function pendencia(over: Partial<PendenciaDto> = {}): PendenciaDto {
  return {
    id: "p1",
    versao: "111",
    titulo: "Renovar passaporte",
    descricao: null,
    dataPrevista: "2026-04-15",
    responsavelId: "u1",
    responsavelNome: "Ana Paula",
    clienteId: "c1",
    clienteNome: "Lúcia Mendes",
    viagemId: "v1",
    codigoViagem: "VG-2026-0042",
    status: "aberta",
    origem: "automatica",
    prioridade: "urgente",
    adiadaDe: null,
    concluidaEm: null,
    atrasada: false,
    ...over,
  };
}

const ABERTAS = [
  pendencia(),
  pendencia({ id: "p2", versao: "222", titulo: "Confirmar apólice", origem: "manual", prioridade: "normal" }),
];

const chamadas: { url: string; method: string; body: unknown }[] = [];

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const VIAGENS: ViagemDaPessoaDto[] = [
  {
    id: "v9",
    codigo: "VG-2026-0042",
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: "2026-04-18",
    dataVolta: "2026-04-28",
    titular: true,
    faseOperacional: "confirmada",
    faseFinanceira: "a_receber",
  },
];

function montar(podeEditar = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ListaPendencias viagemId="v1" passageiros={[]} vendedores={[]} podeEditar={podeEditar} />
    </QueryClientProvider>,
  );
}

function montarPessoa() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <ListaPendencias clienteId="c1" viagens={VIAGENS} vendedores={[]} podeEditar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  chamadas.length = 0;
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    if (url.includes("/concluir")) return Promise.resolve(resposta(200, ABERTAS[0]));
    return Promise.resolve(resposta(200, ABERTAS));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("lista as pendências abertas da viagem", async () => {
  montar();
  expect(await screen.findByText("Renovar passaporte — Lúcia Mendes")).toBeInTheDocument();
  expect(screen.getByText("Confirmar apólice — Lúcia Mendes")).toBeInTheDocument();
  expect(chamadas[0]?.url).toContain("incluirConcluidas=false");
});

test('marcar "Mostrar concluídas" refaz a query com incluirConcluidas=true', async () => {
  montar();
  await screen.findByText("Renovar passaporte — Lúcia Mendes");

  fireEvent.click(screen.getByLabelText("Mostrar concluídas"));

  await waitFor(() => {
    expect(chamadas.some((c) => c.url.includes("incluirConcluidas=true"))).toBe(true);
  });
});

test('"✓ Concluir" chama POST …/concluir com a versão da pendência', async () => {
  montar();
  await screen.findByText("Renovar passaporte — Lúcia Mendes");

  fireEvent.click(screen.getAllByRole("button", { name: "✓ Concluir" })[0]!);

  await waitFor(() => {
    const c = chamadas.find((x) => x.url.includes("/pendencias/p1/concluir"));
    expect(c?.method).toBe("POST");
    expect(c?.body).toEqual({ versao: "111" });
  });
});

test("pendência automática não oferece Editar nem Excluir no menu", async () => {
  montar();
  await screen.findByText("Renovar passaporte — Lúcia Mendes");

  fireEvent.click(screen.getByRole("button", { name: "Mais ações de Renovar passaporte" }));
  expect(screen.getByRole("menuitem", { name: "Adiar" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Editar" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Excluir" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Mais ações de Confirmar apólice" }));
  expect(screen.getByRole("menuitem", { name: "Editar" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Excluir" })).toBeInTheDocument();
});

test("escopo pessoa busca as pendências do cliente", async () => {
  montarPessoa();
  await screen.findByText("Renovar passaporte — Lúcia Mendes");
  expect(chamadas[0]?.url).toContain("/clientes/c1/pendencias?incluirConcluidas=false");
});

test("escopo pessoa cria a pendência com a viagem relacionada", async () => {
  montarPessoa();
  await screen.findByText("Renovar passaporte — Lúcia Mendes");

  fireEvent.click(screen.getByRole("button", { name: "+ Nova pendência" }));
  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Renovar visto" } });
  fireEvent.change(screen.getByLabelText(/Viagem relacionada/), { target: { value: "v9" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar pendência" }));

  await waitFor(() => {
    const c = chamadas.find((x) => x.method === "POST");
    expect(c?.url).toContain("/clientes/c1/pendencias");
    expect(c?.body).toMatchObject({ titulo: "Renovar visto", viagemId: "v9" });
  });
});
