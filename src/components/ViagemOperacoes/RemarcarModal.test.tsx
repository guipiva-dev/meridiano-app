import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ValidationError } from "@/api/errors";
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

test("nova venda ao cliente vem pré-preenchida e, se não mudar, não é enviada", async () => {
  const user = userEvent.setup();
  const r = { ...reserva(), valorCliente: 3200 };
  const v = viagem(r);
  remarcar.mockResolvedValue(v);
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={vi.fn()} />);

  expect(screen.getByLabelText("Nova venda ao cliente")).toHaveValue("R$ 3.200,00");
  await user.type(screen.getByLabelText(/Descrição/), "Troca de hotel");
  await user.click(screen.getByRole("button", { name: "Remarcar" }));

  expect(remarcar.mock.calls[0]?.[1]).not.toHaveProperty("novoValorCliente");
});

test("nova venda alterada é enviada como novoValorCliente", async () => {
  const user = userEvent.setup();
  const r = { ...reserva(), valorCliente: 3200 };
  const v = viagem(r);
  remarcar.mockResolvedValue(v);
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={vi.fn()} />);

  await user.type(screen.getByLabelText(/Descrição/), "Upgrade de quarto");
  fireEvent.change(screen.getByLabelText("Nova venda ao cliente"), { target: { value: "3.900,00" } });
  await user.click(screen.getByRole("button", { name: "Remarcar" }));

  expect(remarcar).toHaveBeenCalledWith("r1", expect.objectContaining({ novoValorCliente: 3900 }));
});

test("sem valorCliente (sem verValores) não mostra o campo de nova venda", () => {
  const r = reserva();
  render(<RemarcarModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onRemarcada={vi.fn()} />);
  expect(screen.queryByLabelText("Nova venda ao cliente")).toBeNull();
});

test("avisa quando o novo custo fica acima da venda ao cliente", () => {
  const r = { ...reserva(), valorCliente: 3200 };
  const v = viagem(r);
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={vi.fn()} />);

  expect(screen.queryByText(/RAV do cliente ficará negativo/)).toBeNull();
  fireEvent.change(screen.getByLabelText("Novo valor da reserva"), { target: { value: "3.500,00" } });
  expect(screen.getByText("Venda abaixo do custo: RAV do cliente ficará negativo")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Nova venda ao cliente"), { target: { value: "4.000,00" } });
  expect(screen.queryByText(/RAV do cliente ficará negativo/)).toBeNull();
});

test("A12: RAV do cliente via operadora, novo custo deixa o esperado negativo — bloqueia e mostra erro sem chamar a API", async () => {
  const user = userEvent.setup();
  const r = {
    ...reserva(),
    valorTotal: 10000,
    valorComissao: 1000,
    ravOperadora: 100,
    valorCliente: 10500,
    ravClienteModo: "via_operadora" as const,
  };
  const v = viagem(r);
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={vi.fn()} />);

  await user.type(screen.getByLabelText(/Descrição/), "Cliente trocou o hotel");
  fireEvent.change(screen.getByLabelText("Novo valor da reserva"), { target: { value: "12.000,00" } });
  expect(screen.getByText("Desconto maior que a comissão: o total da comissão ficaria negativo")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Remarcar" }));

  expect(remarcar).not.toHaveBeenCalled();
});

test("A12: erro do back esperado_negativo aparece sob 'Nova venda ao cliente'", async () => {
  const user = userEvent.setup();
  const r = { ...reserva(), valorCliente: 3200, ravClienteModo: "via_operadora" as const };
  const v = viagem(r);
  remarcar.mockRejectedValue(new ValidationError(422, "esperado_negativo", "Esperado da operadora ficaria negativo"));
  render(<RemarcarModal open reserva={r} viagem={v} onClose={vi.fn()} onRemarcada={vi.fn()} />);

  await user.type(screen.getByLabelText(/Descrição/), "Troca de acomodação");
  await user.click(screen.getByRole("button", { name: "Remarcar" }));

  expect(await screen.findByText("Esperado da operadora ficaria negativo")).toBeInTheDocument();
});
