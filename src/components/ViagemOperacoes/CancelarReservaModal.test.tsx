import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConflictError } from "@/api/errors";
import type * as ViagensApi from "@/api/viagens";
import type { CancelarReservaRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { CancelarReservaModal } from "./CancelarReservaModal";

const cancelarReserva = vi.fn<(reservaId: string, r: CancelarReservaRequest) => Promise<ViagemDto>>();
vi.mock("@/api/viagens", async (importOriginal) => {
  const mod = await importOriginal<typeof ViagensApi>();
  return {
    ...mod,
    viagensApi: {
      ...mod.viagensApi,
      cancelarReserva: (...args: Parameters<typeof cancelarReserva>) => cancelarReserva(...args),
    },
  };
});

function reserva(): ReservaDto {
  return {
    id: "r1",
    versao: "3",
    fornecedorId: "f1",
    fornecedorNome: "CVC",
    localizador: "K7X2PQ",
    dataCompra: "2026-03-14",
    status: "pendente",
    tiposServico: [],
    formasPagamento: [],
    ravClienteModo: "retido_agencia",
    fluxoPagamento: "cliente_paga_operadora",
    nfseStatus: "nao_precisa",
    observacoes: null,
    dataPrevistaComissao: null,
    comissaoMantida: false,
    canceladaEm: null,
    motivoCancelamento: null,
    desfechoCancelamento: null,
    nfseTomador: null,
    nfseNumero: null,
    nfseDataEmissao: null,
    conciliacaoEncerrada: false,
    situacaoComissao: "a_receber",
  };
}

function viagem(r: ReservaDto): ViagemDto {
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
    agenteId: "u1",
    agenteNome: "Ana",
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    canceladaEm: null,
    motivoCancelamento: null,
    faseOperacional: "em_emissao",
    faseFinanceira: "a_receber",
    passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true }],
    reservas: [r],
  };
}

afterEach(() => {
  cancelarReserva.mockReset();
});

test("submit sem motivo mostra erro de campo (validação local)", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  render(<CancelarReservaModal open reserva={r} viagem={v} onClose={vi.fn()} onCancelada={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Cancelar reserva" }));

  expect(await screen.findByText("Motivo é obrigatório")).toBeInTheDocument();
  expect(cancelarReserva).not.toHaveBeenCalled();
});

test("desfecho crédito mostra campos de crédito", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  render(<CancelarReservaModal open reserva={r} viagem={v} onClose={vi.fn()} onCancelada={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Desfecho"), "credito");

  expect(screen.getByLabelText("Valor do crédito")).toBeInTheDocument();
  expect(screen.getByLabelText("Validade")).toBeInTheDocument();
  expect(screen.getByLabelText("Crédito em nome de")).toBeInTheDocument();
});

test("submit com desfecho crédito chama cancelarReserva e onCancelada", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  const dtoRetornado = viagem(r);
  cancelarReserva.mockResolvedValue(dtoRetornado);
  const onCancelada = vi.fn();
  render(<CancelarReservaModal open reserva={r} viagem={v} onClose={vi.fn()} onCancelada={onCancelada} />);

  await user.type(screen.getByLabelText(/Motivo/), "Cliente desistiu");
  await user.selectOptions(screen.getByLabelText("Desfecho"), "credito");
  const campo = screen.getByLabelText("Valor do crédito");
  await user.click(campo);
  await user.type(campo, "9000");
  await user.click(screen.getByRole("button", { name: "Cancelar reserva" }));

  expect(cancelarReserva).toHaveBeenCalledWith("r1", {
    motivo: "Cliente desistiu",
    desfecho: "credito",
    valorReembolso: null,
    comissaoMantida: false,
    credito: { valor: 9000, validade: null, clienteId: "c1" },
    versao: "5",
  });
  expect(onCancelada).toHaveBeenCalledWith(dtoRetornado);
});

test("409 mostra Alert com botão Recarregar que chama onRecarregar", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  cancelarReserva.mockRejectedValue(new ConflictError(409, "conflito", "Alguém alterou"));
  const onRecarregar = vi.fn();
  render(
    <CancelarReservaModal
      open
      reserva={r}
      viagem={v}
      onClose={vi.fn()}
      onCancelada={vi.fn()}
      onRecarregar={onRecarregar}
    />,
  );

  await user.type(screen.getByLabelText(/Motivo/), "Cliente desistiu");
  await user.click(screen.getByRole("button", { name: "Cancelar reserva" }));

  const botaoRecarregar = await screen.findByRole("button", { name: "Recarregar" });
  await user.click(botaoRecarregar);

  expect(onRecarregar).toHaveBeenCalledTimes(1);
});
