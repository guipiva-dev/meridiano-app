import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as ViagensApi from "@/api/viagens";
import type { RemarcarRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { RemarcarModal } from "./RemarcarModal";

const remarcar = vi.fn<(reservaId: string, r: RemarcarRequest) => Promise<ViagemDto>>();
vi.mock("@/api/viagens", async (importOriginal) => {
  const mod = await importOriginal<typeof ViagensApi>();
  return {
    ...mod,
    viagensApi: { ...mod.viagensApi, remarcar: (...args: Parameters<typeof remarcar>) => remarcar(...args) },
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
    valorTotal: 3000,
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
  remarcar.mockReset();
});

test("valor novo vazio envia valorNovo null e datas não editadas ficam null", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  remarcar.mockResolvedValue(v);
  const onRemarcada = vi.fn();
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={onRemarcada} />);

  await user.type(screen.getByLabelText(/Descrição/), "Cliente pediu troca de data de embarque");
  await user.click(screen.getByRole("button", { name: "Remarcar" }));

  expect(remarcar).toHaveBeenCalledWith(
    "r1",
    expect.objectContaining({
      valorNovo: null,
      novaDataIda: null,
      novaDataVolta: null,
    }),
  );
  expect(onRemarcada).toHaveBeenCalledWith(v);
});

test("editar datas dentro do details envia novaDataIda/novaDataVolta", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  remarcar.mockResolvedValue(v);
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={vi.fn()} />);

  await user.type(screen.getByLabelText(/Descrição/), "Data de ida mudou");
  await user.click(screen.getByText("Alterar datas da viagem"));
  fireEvent.change(screen.getByLabelText("Ida"), { target: { value: "2026-06-01" } });
  await user.click(screen.getByRole("button", { name: "Remarcar" }));

  expect(remarcar).toHaveBeenCalledWith(
    "r1",
    expect.objectContaining({
      novaDataIda: "2026-06-01",
      novaDataVolta: "2026-05-10",
    }),
  );
});
