import { RESERVA_1 } from "@/pages/viagens/detalhe/fixtures";
import { duplicarReserva } from "./duplicarReserva";

test("copia fornecedor, serviços, valores, fluxo, formas e data da compra", () => {
  const nova = duplicarReserva({ ...RESERVA_1, ravClienteModo: "via_operadora", valorTaxas: 120, ravOperadora: 30 });
  expect(nova).toMatchObject({
    fornecedorId: "f1",
    tiposServico: ["aereo", "hospedagem", "passeio"],
    valorTotal: 10_000,
    valorTaxas: 120,
    valorComissao: 1000,
    ravOperadora: 30,
    valorCliente: 10_500,
    taxaServico: 500,
    ravClienteModo: "via_operadora",
    fluxoPagamento: "cliente_paga_agencia",
    formasPagamento: ["pix"],
    dataCompra: "2026-02-10",
    comissaoSugerida: false,
    aberta: true,
  });
});

test("não copia id, versão, localizador, status, NFSe nem cancelamento", () => {
  const nova = duplicarReserva({
    ...RESERVA_1,
    status: "cancelada",
    nfseStatus: "emitido",
    nfseNumero: "123",
    comissaoMantida: true,
    canceladaEm: "2026-03-01T10:00:00Z",
    motivoCancelamento: "cliente desistiu",
    desfechoCancelamento: "credito",
    observacoes: "obs",
  });
  expect(nova.id).toBeUndefined();
  expect(nova.versao).toBeUndefined();
  expect(nova.chaveLocal).toBeTruthy();
  expect(nova).toMatchObject({
    localizador: "",
    status: "pendente",
    nfseStatus: "nao_precisa",
    comissaoMantida: false,
    canceladaEm: null,
    motivoCancelamento: null,
    desfechoCancelamento: null,
    observacoes: "",
  });
});
