import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { createMemoryRouter, MemoryRouter, RouterProvider, useLocation } from "react-router";
import type { CreditoDto, ViagemDto } from "@/api/viagens";
import { VIAGEM } from "./fixtures";
import { ModaisViagem } from "./modais";
import { ReservasTab } from "./ReservasTab";
import type { ModalViagem } from "./useViagem";

function resposta(status: number, body: unknown) {
  return {
    ok: status < 300,
    status,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const CREDITO: CreditoDto = {
  id: "cr1",
  clienteId: "c1",
  clienteNome: "Carlos Mendes",
  fornecedorId: "f1",
  fornecedorNome: "CVC Operadora",
  valor: 1200,
  validade: null,
  status: "disponivel",
  reservaOrigemId: null,
  codigoViagemOrigem: null,
  reservaUsoId: null,
};

/** Espelha o par ReservasTab + ModaisViagem que a `ViagemPage` monta. */
function Tela({ creditos, viagem = VIAGEM }: { creditos: CreditoDto[]; viagem?: ViagemDto }) {
  const [modal, setModal] = useState<ModalViagem | null>(null);
  return (
    <>
      <ReservasTab
        viagem={viagem}
        creditos={creditos}
        verValores
        podeEditar
        reservaAberta={undefined}
        abrir={setModal}
      />
      <ModaisViagem
        modal={modal}
        viagem={viagem}
        vendedores={[]}
        creditos={creditos}
        aplicar={() => undefined}
        recarregar={() => undefined}
        fechar={() => {
          setModal(null);
        }}
      />
    </>
  );
}

function montar(creditos: CreditoDto[] = [], viagem?: ViagemDto) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/viagens/v1"]}>
        <Tela creditos={creditos} viagem={viagem} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, [])));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("crédito disponível mostra o alerta com Usar crédito…", () => {
  montar([CREDITO]);
  expect(screen.getByText(/Crédito disponível: 1 · R\$ 1\.200,00/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Usar crédito…" })).toBeInTheDocument();
});

test("sem crédito disponível não mostra o alerta", () => {
  montar();
  expect(screen.queryByRole("button", { name: "Usar crédito…" })).toBeNull();
});

test("crédito sem valor (vendedor externo) mostra só a contagem", () => {
  const semValor = { ...CREDITO };
  delete semValor.valor;
  montar([semValor]);
  const alerta = screen.getByRole("status");
  expect(within(alerta).getByText("Crédito disponível: 1")).toBeInTheDocument();
  expect(within(alerta).queryByText(/R\$/)).toBeNull();
});

test("X01: viagem cancelada não oferece Usar crédito… mesmo com crédito disponível", () => {
  montar([CREDITO], { ...VIAGEM, cancelada: true });
  expect(screen.getByText(/Crédito disponível: 1/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Usar crédito…" })).toBeNull();
});

test("Cancelar reserva… no card 1 abre o modal daquela reserva", () => {
  montar();
  fireEvent.click(screen.getAllByRole("button", { name: "Expandir" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar reserva…" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Cancelar reserva 1");
});

test("Duplicar abre nova reserva com fornecedor e valor total, localizador vazio e focado; salvar faz POST", async () => {
  const chamadas: { url: string; metodo: string; corpo: unknown }[] = [];
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    chamadas.push({
      url,
      metodo: init?.method ?? "GET",
      corpo: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    });
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, [{ id: "f1", nome: "CVC Operadora" }]));
    if (init?.method === "POST") return Promise.resolve(resposta(200, VIAGEM));
    return Promise.resolve(resposta(200, []));
  });
  montar();
  fireEvent.click(screen.getAllByRole("button", { name: "Expandir" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Duplicar" }));

  const nova = screen.getByRole("region", { name: `Reserva ${VIAGEM.reservas.length + 1}` });
  const localizador = within(nova).getByLabelText("Localizador");
  expect(localizador).toHaveValue("");
  expect(localizador).toHaveFocus();
  expect(await within(nova).findByRole("option", { name: "CVC Operadora" })).toBeInTheDocument();
  expect(within(nova).getByLabelText("Fornecedor")).toHaveValue("f1");
  expect(within(nova).getByLabelText("Total da reserva")).toHaveValue("R$ 10.000,00");

  fireEvent.click(screen.getByRole("button", { name: "Salvar reserva" }));
  await waitFor(() => {
    expect(chamadas.some((c) => c.metodo === "POST")).toBe(true);
  });
  const post = chamadas.find((c) => c.metodo === "POST")!;
  expect(post.url).toContain(`/viagens/${VIAGEM.id}/reservas`);
  expect(post.corpo).toMatchObject({
    versao: VIAGEM.versao,
    reserva: { fornecedorId: "f1", valorTotal: 10_000, localizador: null, status: "pendente" },
  });
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: "Salvar reserva" })).toBeNull();
  });
});

test("§9: localizador já usado (fornecedor+localizador) mostra aviso na reserva duplicada", async () => {
  vi.stubGlobal("fetch", (url: string) => {
    if (url.includes("/fornecedores")) return Promise.resolve(resposta(200, [{ id: "f1", nome: "CVC Operadora" }]));
    if (url.includes("/reservas/duplicada") && url.includes("K7X2PQ"))
      return Promise.resolve(resposta(200, { viagemId: "v9", codigo: "V-0009" }));
    return Promise.resolve(resposta(200, []));
  });
  montar();
  fireEvent.click(screen.getAllByRole("button", { name: "Expandir" })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "Duplicar" }));
  const nova = screen.getByRole("region", { name: `Reserva ${VIAGEM.reservas.length + 1}` });
  fireEvent.change(within(nova).getByLabelText("Localizador"), { target: { value: "K7X2PQ" } });
  expect(await within(nova).findByText("Este localizador já está na viagem V-0009.")).toBeInTheDocument();
});

test("sem verValores a ação Duplicar não aparece", () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/viagens/v1"]}>
        <ReservasTab
          viagem={VIAGEM}
          creditos={[]}
          verValores={false}
          podeEditar
          reservaAberta={undefined}
          abrir={() => undefined}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getAllByRole("button", { name: "Expandir" })[0]!);
  expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Duplicar" })).toBeNull();
});

test("reserva cancelada também pode ser duplicada", () => {
  const cancelada = { ...VIAGEM.reservas[0]!, status: "cancelada" as const };
  montar([], { ...VIAGEM, reservas: [cancelada] });
  fireEvent.click(screen.getByRole("button", { name: "Expandir" }));
  expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  expect(screen.getByRole("button", { name: "Duplicar" })).toBeInTheDocument();
});

/** F03: sinaliza para `useNovaViagem` abrir já com uma reserva em branco, sem precisar clicar de novo lá. */
function ProbeEditar() {
  const estado = useLocation().state as { novaReserva?: boolean } | null;
  return <p>novaReserva={String(estado?.novaReserva)}</p>;
}

test("F03: + Adicionar reserva navega para editar já sinalizando novaReserva", () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/viagens/v1", element: <Tela creditos={[]} /> },
      { path: "/viagens/v1/editar", element: <ProbeEditar /> },
    ],
    { initialEntries: ["/viagens/v1"] },
  );
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "+ Adicionar reserva" }));
  expect(screen.getByText("novaReserva=true")).toBeInTheDocument();
});
