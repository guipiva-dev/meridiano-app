import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ViagensApi from "@/api/viagens";
import type { CreditoDto, ReservaDto, ViagemDto } from "@/api/viagens";
import { UsarCreditoModal } from "./UsarCreditoModal";

const consumirCredito =
  vi.fn<(id: string, creditoId: string, reservaId: string, versao: string) => Promise<ViagemDto>>();
vi.mock("@/api/viagens", async (importOriginal) => {
  const mod = await importOriginal<typeof ViagensApi>();
  return {
    ...mod,
    viagensApi: {
      ...mod.viagensApi,
      consumirCredito: (...args: Parameters<typeof consumirCredito>) => consumirCredito(...args),
    },
  };
});

function reserva(id: string, fornecedorId: string, fornecedorNome: string): ReservaDto {
  return {
    id,
    versao: "1",
    fornecedorId,
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

function credito(id: string, fornecedorId: string, fornecedorNome: string): CreditoDto {
  return {
    id,
    clienteId: "c1",
    clienteNome: "Carlos Mendes",
    fornecedorId,
    fornecedorNome,
    valor: 500,
    validade: null,
    status: "disponivel",
    reservaOrigemId: null,
    codigoViagemOrigem: null,
    reservaUsoId: null,
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
    reservas: [reserva("r1", "f-cvc", "CVC"), reserva("r2", "f-decolar", "Decolar")],
  };
}

afterEach(() => {
  consumirCredito.mockReset();
});

test("escolher crédito CVC filtra reservas para CVC e envia consumirCredito", async () => {
  const user = userEvent.setup();
  const v = viagem();
  const creditos = [credito("cred1", "f-cvc", "CVC"), credito("cred2", "f-decolar", "Decolar")];
  consumirCredito.mockResolvedValue(v);
  const onUsado = vi.fn();
  render(<UsarCreditoModal open viagem={v} creditos={creditos} onClose={vi.fn()} onUsado={onUsado} />);

  await user.click(screen.getByLabelText(/CVC/));

  const select = screen.getByLabelText(/Aplicar na reserva/);
  expect(select).not.toBeDisabled();
  expect(within(select).getByRole("option", { name: /CVC/ })).toBeInTheDocument();
  expect(within(select).queryByRole("option", { name: /Decolar/ })).not.toBeInTheDocument();

  await user.selectOptions(select, "r1");
  await user.click(screen.getByRole("button", { name: "Usar crédito" }));

  expect(consumirCredito).toHaveBeenCalledWith("v1", "cred1", "r1", "5");
  expect(onUsado).toHaveBeenCalledWith(v);
});

test("crédito sem valor (vendedor externo) aparece na lista e pode ser selecionado", async () => {
  const user = userEvent.setup();
  const v = viagem();
  const semValor = credito("cred1", "f-cvc", "CVC");
  delete semValor.valor;
  consumirCredito.mockResolvedValue(v);
  const onUsado = vi.fn();
  render(<UsarCreditoModal open viagem={v} creditos={[semValor]} onClose={vi.fn()} onUsado={onUsado} />);

  const opcao = screen.getByLabelText(/CVC · — · sem validade/);
  await user.click(opcao);

  const select = screen.getByLabelText(/Aplicar na reserva/);
  await user.selectOptions(select, "r1");
  await user.click(screen.getByRole("button", { name: "Usar crédito" }));

  expect(consumirCredito).toHaveBeenCalledWith("v1", "cred1", "r1", "5");
  expect(onUsado).toHaveBeenCalledWith(v);
});
