import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ViagemDaPessoaDto } from "@/api/clientes";
import type { PassageiroDto, VendedorDto } from "@/api/viagens";
import { NovaPendenciaModal } from "./NovaPendenciaModal";

const PASSAGEIROS: PassageiroDto[] = [
  { clienteId: "c1", nome: "Carlos Mendes", titular: true },
  { clienteId: "c2", nome: "Lúcia Mendes", titular: false },
  { clienteId: "c3", nome: "Pedro Mendes", titular: false },
];
const VENDEDORES: VendedorDto[] = [
  { id: "u1", nome: "Guilherme", perfil: "dono", geraRepasse: false, percentualPadrao: 0 },
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
  {
    id: "v8",
    codigo: "VG-2025-0007",
    destino: "Bariloche",
    tipo: "internacional",
    dataIda: "2025-07-01",
    dataVolta: "2025-07-10",
    titular: false,
    faseOperacional: "cancelada",
    faseFinanceira: "nao_prevista",
  },
];

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <NovaPendenciaModal
        open
        escopo={{ viagemId: "v1", passageiros: PASSAGEIROS }}
        vendedores={VENDEDORES}
        onClose={() => undefined}
        onSalva={() => undefined}
      />
    </QueryClientProvider>,
  );
}

function montarAgenda() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <NovaPendenciaModal
        open
        escopo={{ agenda: true, responsavelId: null }}
        vendedores={VENDEDORES}
        onClose={() => undefined}
        onSalva={() => undefined}
      />
    </QueryClientProvider>,
  );
}

function montarPessoa() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <NovaPendenciaModal
        open
        escopo={{ clienteId: "c1", viagens: VIAGENS }}
        vendedores={VENDEDORES}
        onClose={() => undefined}
        onSalva={() => undefined}
      />
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
    return Promise.resolve(resposta(201, []));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("selecionar 2 passageiros muda o botão e envia clienteIds com 2", async () => {
  montar();
  expect(screen.getByRole("button", { name: "Criar 1 pendência" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Carlos Mendes" }));
  fireEvent.click(screen.getByRole("button", { name: "Lúcia Mendes" }));
  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Enviar voucher" } });

  const criar = screen.getByRole("button", { name: "Criar 2 pendências" });
  fireEvent.click(criar);

  await waitFor(() => {
    const c = chamadas.find((x) => x.method === "POST");
    expect(c?.url).toContain("/viagens/v1/pendencias");
    expect((c?.body as { clienteIds: string[] }).clienteIds).toEqual(["c1", "c2"]);
  });
});

test("Enter no formulário salva: o botão é o submit do form (que é o do modal)", async () => {
  montar();
  const form = document.querySelector("form");
  const botao = screen.getByRole("button", { name: "Criar 1 pendência" });
  expect(botao).toHaveAttribute("type", "submit");
  expect(botao.getAttribute("form")).toBe(form?.id);

  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Enviar voucher" } });
  fireEvent.submit(form!);

  await waitFor(() => {
    expect(chamadas.some((c) => c.method === "POST")).toBe(true);
  });
});

test('escopo pessoa troca os chips "Para quem" por "Viagem relacionada" (sem canceladas)', () => {
  montarPessoa();

  expect(screen.queryByText("Para quem")).toBeNull();
  expect(screen.queryByRole("button", { name: "Carlos Mendes" })).toBeNull();
  const select = screen.getByLabelText(/Viagem relacionada/);
  expect(select).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /VG-2026-0042/ })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /VG-2025-0007/ })).toBeNull();
  expect(screen.getByRole("button", { name: "Criar pendência" })).toBeInTheDocument();
});

test("sem título mostra erro local e não chama a API", async () => {
  montar();

  fireEvent.click(screen.getByRole("button", { name: "Criar 1 pendência" }));

  expect(await screen.findByText("Descreva o que precisa ser feito")).toBeInTheDocument();
  expect(chamadas.some((c) => c.method === "POST")).toBe(false);
});

test("escopo agenda: sem 'Para quem', envia POST /pendencias com clienteIds []", async () => {
  montarAgenda();

  expect(screen.queryByText("Para quem")).toBeNull();
  expect(screen.getByRole("button", { name: "Criar pendência" })).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Ligar para o cliente" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar pendência" }));

  await waitFor(() => {
    const c = chamadas.find((x) => x.method === "POST");
    expect(c?.url).toBe("/api/v1/pendencias");
    expect(c?.body).toMatchObject({ titulo: "Ligar para o cliente", clienteIds: [] });
  });
});

test("escopo agenda: selecionar uma pessoa envia clienteIds com o id dela", async () => {
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
    });
    if (url.includes("/clientes/busca"))
      return Promise.resolve(resposta(200, [{ id: "c9", nome: "Roberto Tanaka", telefone: null }]));
    return Promise.resolve(resposta(201, []));
  });
  vi.useFakeTimers();

  montarAgenda();
  fireEvent.change(screen.getByLabelText(/O que precisa ser feito/), { target: { value: "Retomar contato" } });
  fireEvent.change(screen.getByPlaceholderText("Buscar pessoa…"), { target: { value: "rob" } });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
  fireEvent.mouseDown(screen.getByRole("option", { name: "Roberto Tanaka" }));

  vi.useRealTimers();
  fireEvent.click(screen.getByRole("button", { name: "Criar pendência" }));

  await waitFor(() => {
    const c = chamadas.find((x) => x.method === "POST" && x.url === "/api/v1/pendencias");
    expect((c?.body as { clienteIds: string[] }).clienteIds).toEqual(["c9"]);
  });
});
