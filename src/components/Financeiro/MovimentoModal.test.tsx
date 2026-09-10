import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as FinanceiroApi from "@/api/financeiro";
import type { MovimentoDto, MovimentoRequest } from "@/api/financeiro";
import type { ReservaDto, ViagemDto } from "@/api/viagens";
import { MovimentoModal } from "./MovimentoModal";

const lancar = vi.fn<(m: MovimentoRequest, motivo?: string) => Promise<MovimentoDto>>();
const corrigir = vi.fn<(id: string, m: MovimentoRequest, motivo?: string) => Promise<MovimentoDto>>();
vi.mock("@/api/financeiro", async (importOriginal) => {
  const mod = await importOriginal<typeof FinanceiroApi>();
  return {
    ...mod,
    financeiroApi: {
      ...mod.financeiroApi,
      lancar: (...args: Parameters<typeof lancar>) => lancar(...args),
      corrigir: (...args: Parameters<typeof corrigir>) => corrigir(...args),
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
    status: "emitida",
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
    dataIda: null,
    dataVolta: null,
    vendedorId: "u1",
    vendedorNome: "Ana",
    agenteId: null,
    agenteNome: null,
    ocasiao: null,
    observacoes: null,
    cancelada: false,
    canceladaEm: null,
    motivoCancelamento: null,
    faseOperacional: "confirmada",
    faseFinanceira: "a_receber",
    passageiros: [],
    reservas: [reserva()],
  };
}

function movimento(): MovimentoDto {
  return {
    id: "m1",
    versao: "7",
    reservaId: "r1",
    viagemId: "v1",
    codigoViagem: "VG-2026-0001",
    localizador: "K7X2PQ",
    fornecedorNome: "CVC",
    tipo: "pagamento_fornecedor",
    valor: -500,
    dataMovimento: "2026-04-02",
    formaPagamento: "pix",
    observacao: null,
    criadoPorNome: "Ana",
    criadoEm: "2026-04-02T10:00:00Z",
  };
}

afterEach(() => {
  lancar.mockReset();
  corrigir.mockReset();
});

test("lançamento novo envia o valor positivo com a reserva escolhida", async () => {
  const user = userEvent.setup();
  const dto = movimento();
  lancar.mockResolvedValue(dto);
  const onSalvo = vi.fn();
  render(<MovimentoModal open viagem={viagem()} onClose={vi.fn()} onSalvo={onSalvo} />);

  const valor = screen.getByLabelText(/^Valor/);
  await user.click(valor);
  await user.clear(valor);
  await user.type(valor, "500");
  await user.selectOptions(screen.getByLabelText(/^Tipo/), "pagamento_fornecedor");
  fireEvent.change(screen.getByLabelText(/^Data/), { target: { value: "2026-04-02" } });
  await user.click(screen.getByRole("button", { name: "Lançar movimento" }));

  expect(lancar).toHaveBeenCalledWith(
    expect.objectContaining({ reservaId: "r1", tipo: "pagamento_fornecedor", valor: 500, dataMovimento: "2026-04-02" }),
    undefined,
  );
  expect(onSalvo).toHaveBeenCalledWith(dto);
});

test("edição trava reserva e tipo e manda a versão", async () => {
  const user = userEvent.setup();
  const mov = movimento();
  corrigir.mockResolvedValue(mov);
  render(<MovimentoModal open viagem={viagem()} movimento={mov} onClose={vi.fn()} onSalvo={vi.fn()} />);

  expect(screen.getByLabelText(/^Reserva/)).toBeDisabled();
  expect(screen.getByLabelText(/^Tipo/)).toBeDisabled();
  expect(screen.getByLabelText(/^Valor/)).toHaveValue("R$ 500,00");

  await user.click(screen.getByRole("button", { name: "Salvar correção" }));

  expect(corrigir).toHaveBeenCalledWith(
    "m1",
    expect.objectContaining({ valor: 500, tipo: "pagamento_fornecedor", versao: "7" }),
    undefined,
  );
});
