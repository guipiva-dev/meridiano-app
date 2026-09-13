import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ValidationError } from "@/api/errors";
import type * as ViagensApi from "@/api/viagens";
import type { NfseRequest, ReservaDto, ViagemDto } from "@/api/viagens";
import { hojeIso } from "@/lib/datas";
import { NfseModal } from "./NfseModal";

const nfse = vi.fn<(reservaId: string, r: NfseRequest) => Promise<ViagemDto>>();
vi.mock("@/api/viagens", async (importOriginal) => {
  const mod = await importOriginal<typeof ViagensApi>();
  return {
    ...mod,
    viagensApi: { ...mod.viagensApi, nfse: (...args: Parameters<typeof nfse>) => nfse(...args) },
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
    nfseStatus: "falta_emitir",
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
    faseOperacional: "confirmada",
    faseFinanceira: "a_receber",
    passageiros: [{ clienteId: "c1", nome: "Carlos Mendes", titular: true }],
    reservas: [r],
  };
}

afterEach(() => {
  nfse.mockReset();
});

test("Emitida sem tomador: erro local e não chama a API", async () => {
  const user = userEvent.setup();
  const r = reserva();
  render(<NfseModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.type(screen.getByLabelText(/Número/), "123");
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(screen.getByText("Tomador é obrigatório para NFSe emitida")).toBeInTheDocument();
  expect(nfse).not.toHaveBeenCalled();
});

test("Emitida com tomador envia normalmente", async () => {
  const user = userEvent.setup();
  const r = reserva();
  const v = viagem(r);
  nfse.mockResolvedValue(v);
  const onSalva = vi.fn();
  render(<NfseModal open reserva={r} viagem={v} onClose={vi.fn()} onSalva={onSalva} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.selectOptions(screen.getByLabelText(/Tomador/), "cliente");
  await user.type(screen.getByLabelText(/Número/), "123");
  fireEvent.change(screen.getByLabelText(/Emissão/), { target: { value: "2026-01-10" } });
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(nfse).toHaveBeenCalledWith(
    "r1",
    expect.objectContaining({ status: "emitido", tomador: "cliente", dataEmissao: "2026-01-10" }),
  );
  expect(onSalva).toHaveBeenCalledWith(v);
});

test("A38: Emitida sem número mostra erro local e não chama a API", async () => {
  const user = userEvent.setup();
  const r = reserva();
  render(<NfseModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.selectOptions(screen.getByLabelText(/Tomador/), "cliente");
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(screen.getByText("Número é obrigatório para NFSe emitida")).toBeInTheDocument();
  expect(nfse).not.toHaveBeenCalled();
});

test("M2: Emitida sem data de emissão mostra erro local e não chama a API", async () => {
  const user = userEvent.setup();
  const r = reserva();
  render(<NfseModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.selectOptions(screen.getByLabelText(/Tomador/), "cliente");
  await user.type(screen.getByLabelText(/Número/), "123");
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(screen.getByText("Informe a data de emissão")).toBeInTheDocument();
  expect(screen.getByLabelText(/Emissão/)).toBeRequired();
  expect(nfse).not.toHaveBeenCalled();
});

test("A38: Emitida com data de emissão futura mostra erro local e não chama a API", async () => {
  const user = userEvent.setup();
  const r = reserva();
  render(<NfseModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.selectOptions(screen.getByLabelText(/Tomador/), "cliente");
  await user.type(screen.getByLabelText(/Número/), "123");
  fireEvent.change(screen.getByLabelText(/Emissão/), { target: { value: "2099-01-01" } });
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(screen.getByText("Data de emissão não pode ser no futuro")).toBeInTheDocument();
  expect(nfse).not.toHaveBeenCalled();
});

test("422 nfse_data_futura mostra a mensagem do servidor sob o campo de emissão", async () => {
  const user = userEvent.setup();
  const r = reserva();
  nfse.mockRejectedValue(new ValidationError(422, "nfse_data_futura", "Data de emissão não pode ser no futuro"));
  render(<NfseModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.selectOptions(screen.getByLabelText(/Tomador/), "cliente");
  await user.type(screen.getByLabelText(/Número/), "123");
  fireEvent.change(screen.getByLabelText(/Emissão/), { target: { value: hojeIso() } });
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByText("Data de emissão não pode ser no futuro")).toBeInTheDocument();
});

test("422 nfse_incompleta mostra a mensagem do servidor", async () => {
  const user = userEvent.setup();
  const r = reserva();
  nfse.mockRejectedValue(
    new ValidationError(422, "nfse_incompleta", "NFSe emitida exige número, data de emissão e tomador"),
  );
  render(<NfseModal open reserva={r} viagem={viagem(r)} onClose={vi.fn()} onSalva={vi.fn()} />);

  await user.selectOptions(screen.getByLabelText("Status"), "emitido");
  await user.selectOptions(screen.getByLabelText(/Tomador/), "operadora");
  await user.type(screen.getByLabelText(/Número/), "123");
  fireEvent.change(screen.getByLabelText(/Emissão/), { target: { value: "2026-01-10" } });
  await user.click(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByText("NFSe emitida exige número, data de emissão e tomador")).toBeInTheDocument();
});
