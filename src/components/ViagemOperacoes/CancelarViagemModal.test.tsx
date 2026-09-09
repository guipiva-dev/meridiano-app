import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ViagensApi from "@/api/viagens";
import type { CancelarViagemRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { CancelarViagemModal } from "./CancelarViagemModal";

const cancelarViagem = vi.fn<(id: string, r: CancelarViagemRequest) => Promise<ViagemDto>>();
vi.mock("@/api/viagens", async (importOriginal) => {
  const mod = await importOriginal<typeof ViagensApi>();
  return {
    ...mod,
    viagensApi: {
      ...mod.viagensApi,
      cancelarViagem: (...args: Parameters<typeof cancelarViagem>) => cancelarViagem(...args),
    },
  };
});

function reserva(id: string, fornecedorNome: string): ReservaDto {
  return {
    id,
    versao: "1",
    fornecedorId: `f-${id}`,
    fornecedorNome,
    localizador: null,
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

function viagem(): ViagemDto {
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
    reservas: [reserva("r1", "CVC"), reserva("r2", "Decolar")],
  };
}

afterEach(() => {
  cancelarViagem.mockReset();
});

test("lista reservas ativas e o botão mostra a contagem", () => {
  const v = viagem();
  render(<CancelarViagemModal open viagem={v} onClose={vi.fn()} onCancelada={vi.fn()} />);

  expect(screen.getByRole("button", { name: "Cancelar viagem e 2 reservas" })).toBeInTheDocument();
  expect(screen.getByText(/CVC/)).toBeInTheDocument();
  expect(screen.getByText(/Decolar/)).toBeInTheDocument();
});

test("submit envia reservas com 2 itens", async () => {
  const user = userEvent.setup();
  const v = viagem();
  cancelarViagem.mockResolvedValue(v);
  const onCancelada = vi.fn();
  render(<CancelarViagemModal open viagem={v} onClose={vi.fn()} onCancelada={onCancelada} />);

  await user.type(screen.getByLabelText(/Motivo/), "Cliente cancelou tudo");
  await user.click(screen.getByRole("button", { name: "Cancelar viagem e 2 reservas" }));

  expect(cancelarViagem).toHaveBeenCalledWith("v1", {
    motivo: "Cliente cancelou tudo",
    reservas: [
      { reservaId: "r1", desfecho: "sem_reembolso", valorReembolso: null, comissaoMantida: false, credito: null },
      { reservaId: "r2", desfecho: "sem_reembolso", valorReembolso: null, comissaoMantida: false, credito: null },
    ],
    versao: "5",
  });
  expect(onCancelada).toHaveBeenCalledWith(v);
});
