import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { ValidationError } from "@/api/errors";
import type * as ViagensApi from "@/api/viagens";
import { chaves, type ReservaDto, type StatusReservaRequest, type ViagemDto } from "@/api/viagens";
import { ReservaDetalheCard } from "./ReservaDetalheCard";

const definirStatusReserva = vi.fn<(reservaId: string, r: StatusReservaRequest) => Promise<ViagemDto>>();
vi.mock("@/api/viagens", async (importOriginal) => {
  const mod = await importOriginal<typeof ViagensApi>();
  return {
    ...mod,
    viagensApi: {
      ...mod.viagensApi,
      definirStatusReserva: (...args: Parameters<typeof definirStatusReserva>) => definirStatusReserva(...args),
    },
  };
});

/** Reserva 2 do protótipo (#s-viagem): Decolar · R$ 3.200,00 · receita R$ 520,00. */
function reservaDto(over: Partial<ReservaDto> = {}): ReservaDto {
  return {
    id: "r2",
    versao: "222",
    fornecedorId: "f2",
    fornecedorNome: "Decolar",
    localizador: "DCL-88213",
    dataCompra: "2026-03-14",
    status: "emitida",
    tiposServico: ["seguro", "traslado"],
    formasPagamento: ["pix"],
    ravClienteModo: "retido_agencia",
    fluxoPagamento: "cliente_paga_operadora",
    nfseStatus: "falta_emitir",
    observacoes: null,
    dataPrevistaComissao: "2026-04-05",
    valorTotal: 3000,
    valorTaxas: 0,
    valorComissao: 270,
    ravOperadora: 0,
    valorCliente: 3200,
    taxaServico: 50,
    receitaPrevista: 520,
    comissaoMantida: false,
    canceladaEm: null,
    motivoCancelamento: null,
    desfechoCancelamento: null,
    nfseTomador: null,
    nfseNumero: null,
    nfseDataEmissao: null,
    conciliacaoEncerrada: false,
    situacaoComissao: "a_receber",
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

function viagemDto(reserva: ReservaDto): ViagemDto {
  return {
    id: "v1",
    codigo: "VG-2026-0001",
    versao: "5",
    destino: "Lisboa",
    tipo: "internacional",
    dataIda: "2026-05-01",
    dataVolta: "2026-05-10",
    vendedorId: "u1",
    vendedorNome: "Ana",
    agenteId: null,
    agenteNome: null,
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    canceladaEm: null,
    motivoCancelamento: null,
    faseOperacional: "em_emissao",
    faseFinanceira: "a_receber",
    passageiros: [],
    reservas: [reserva],
  };
}

/** Monta o card na rota da viagem (`/viagens/:id`) com a viagem já no cache, como na página real. */
function montar(props: Partial<Parameters<typeof ReservaDetalheCard>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const reserva = props.reserva ?? reservaDto();
  qc.setQueryData(chaves.viagem("v1"), viagemDto(reserva));
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/viagens/v1"]}>
        <Routes>
          <Route
            path="/viagens/:id"
            element={
              <ReservaDetalheCard
                indice={2}
                reserva={reserva}
                verValores
                podeEditar
                aberta
                onToggle={() => undefined}
                onEditar={() => undefined}
                onRemarcar={() => undefined}
                onCancelar={() => undefined}
                onNfse={() => undefined}
                {...props}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return qc;
}

beforeEach(() => {
  vi.stubGlobal("fetch", () => Promise.resolve(resposta(200, [])));
});

afterEach(() => {
  vi.unstubAllGlobals();
  definirStatusReserva.mockReset();
});

test("fechado mostra só o header", () => {
  montar({ aberta: false });
  expect(screen.getByRole("region", { name: /Reserva 2/ })).toBeInTheDocument();
  expect(screen.getByText("Decolar")).toBeInTheDocument();
  expect(screen.queryByText("Histórico de alterações")).toBeNull();
  expect(screen.getByRole("button", { name: "Expandir" })).toBeInTheDocument();
});

test("aberto mostra o resultado da reserva e as ações", () => {
  montar();
  expect(screen.getByText("Receita da agência").parentElement).toHaveTextContent("R$ 520,00");
  expect(screen.getByText("Histórico de alterações")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remarcar…" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancelar reserva…" })).toBeInTheDocument();
});

test("histórico não afirma 'sem alterações' antes de a query resolver", async () => {
  montar();
  expect(screen.queryByText("Sem alterações registradas.")).toBeNull();
  expect(await screen.findByText("Sem alterações registradas.")).toBeInTheDocument();
});

test("cancelada mostra o bloco Cancelamento e esconde as ações", () => {
  montar({
    reserva: reservaDto({
      status: "cancelada",
      canceladaEm: "2026-03-20T10:00:00Z",
      motivoCancelamento: "Cliente desistiu",
      desfechoCancelamento: "credito",
      comissaoMantida: true,
    }),
  });
  expect(screen.getByText("Cancelamento")).toBeInTheDocument();
  expect(screen.getByText(/Cliente desistiu/)).toBeInTheDocument();
  expect(screen.getByText("comissão mantida")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cancelar reserva…" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Marcar emitida" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Voltar a em emissão" })).toBeNull();
  // Comissão mantida não zera a receita: o preview tem que bater com o valor do servidor.
  expect(screen.getByText("Receita da agência").parentElement).toHaveTextContent("R$ 520,00");
});

test("cancelada sem comissão mantida zera a receita no preview", () => {
  montar({
    reserva: reservaDto({
      status: "cancelada",
      canceladaEm: "2026-03-20T10:00:00Z",
      comissaoMantida: false,
      receitaPrevista: 0,
    }),
  });
  expect(screen.getByText("Receita da agência").parentElement).toHaveTextContent("R$ 0,00");
});

test("sem verValores não mostra receita nem o resultado da reserva", () => {
  montar({ verValores: false });
  expect(screen.queryByText(/receita/)).toBeNull();
  expect(screen.queryByText("Receita da agência")).toBeNull();
});

test("histórico sem valores (vendedor externo) mostra a descrição sem R$", async () => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(
      resposta(200, [
        {
          id: "a1",
          dataAlteracao: "2026-03-10T00:00:00Z",
          descricao: "Remarcação de datas",
          usuarioNome: "Ana",
          criadoEm: "2026-03-10T00:00:00Z",
        },
      ]),
    ),
  );
  montar({ verValores: false });
  expect(await screen.findByText(/Remarcação de datas/)).toBeInTheDocument();
  expect(screen.queryByText(/R\$/)).toBeNull();
});

test("pendente: 'Marcar emitida' envia status emitida com a versão da viagem e atualiza o cache", async () => {
  const user = userEvent.setup();
  const r = reservaDto({ status: "pendente" });
  const atualizada = { ...viagemDto({ ...r, status: "emitida" }), versao: "6", faseOperacional: "confirmada" };
  definirStatusReserva.mockResolvedValue(atualizada);
  const qc = montar({ reserva: r });

  expect(screen.queryByRole("button", { name: "Voltar a em emissão" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Marcar emitida" }));

  expect(definirStatusReserva).toHaveBeenCalledWith("r2", { status: "emitida", versao: "5" });
  await waitFor(() => {
    expect(qc.getQueryData(chaves.viagem("v1"))).toEqual(atualizada);
  });
});

test("emitida: 'Voltar a em emissão' envia status pendente", async () => {
  const user = userEvent.setup();
  const r = reservaDto({ status: "emitida" });
  definirStatusReserva.mockResolvedValue(viagemDto({ ...r, status: "pendente" }));
  montar({ reserva: r });

  expect(screen.queryByRole("button", { name: "Marcar emitida" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Voltar a em emissão" }));

  expect(definirStatusReserva).toHaveBeenCalledWith("r2", { status: "pendente", versao: "5" });
});

test("422 ao mudar status aparece no card", async () => {
  const user = userEvent.setup();
  definirStatusReserva.mockRejectedValue(new ValidationError(422, "reserva_cancelada", "Reserva cancelada"));
  montar({ reserva: reservaDto({ status: "pendente" }) });

  await user.click(screen.getByRole("button", { name: "Marcar emitida" }));

  expect(await screen.findByText("Reserva cancelada")).toBeInTheDocument();
});

test("sem podeEditar não mostra o botão de status", () => {
  montar({ reserva: reservaDto({ status: "pendente" }), podeEditar: false });
  expect(screen.queryByRole("button", { name: "Marcar emitida" })).toBeNull();
});
