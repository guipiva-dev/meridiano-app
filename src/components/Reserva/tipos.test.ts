import type { ReservaDto } from "@/api/viagens";
import { deDto, paraRequest, reservaVazia } from "./tipos";

function dtoBase(overrides: Partial<ReservaDto> = {}): ReservaDto {
  return {
    id: "r1",
    versao: "v1",
    fornecedorId: "f1",
    fornecedorNome: "Decolar",
    localizador: "DCL-88213",
    dataCompra: "2026-03-14",
    status: "emitida",
    tiposServico: ["aereo"],
    formasPagamento: ["pix"],
    ravClienteModo: "via_operadora",
    fluxoPagamento: "cliente_paga_operadora",
    nfseStatus: "nao_precisa",
    observacoes: null,
    dataPrevistaComissao: null,
    valorTotal: 3000,
    valorTaxas: 120,
    valorComissao: 300,
    ravOperadora: 20,
    valorCliente: 3200,
    taxaServico: 0,
    comissaoMantida: false,
    canceladaEm: null,
    motivoCancelamento: null,
    desfechoCancelamento: null,
    nfseTomador: null,
    nfseNumero: null,
    nfseDataEmissao: null,
    conciliacaoEncerrada: false,
    situacaoComissao: "a_receber",
    ...overrides,
  };
}

test("deDto → paraRequest preserva status 'cancelada' (não reescreve para emitida)", () => {
  const form = deDto(dtoBase({ status: "cancelada" }));
  expect(form.status).toBe("cancelada");
  expect(paraRequest(form).status).toBe("cancelada");
});

test("deDto preserva os campos de cancelamento do dto", () => {
  const form = deDto(
    dtoBase({
      status: "cancelada",
      comissaoMantida: true,
      canceladaEm: "2026-05-01T10:00:00Z",
      motivoCancelamento: "Cliente desistiu",
      desfechoCancelamento: "credito",
    }),
  );
  expect(form.comissaoMantida).toBe(true);
  expect(form.canceladaEm).toBe("2026-05-01T10:00:00Z");
  expect(form.motivoCancelamento).toBe("Cliente desistiu");
  expect(form.desfechoCancelamento).toBe("credito");
});

test("paraRequest: null nos campos de dinheiro vira 0", () => {
  const req = paraRequest(reservaVazia(0));
  expect(req.valorTotal).toBe(0);
  expect(req.valorTaxas).toBe(0);
  expect(req.valorComissao).toBe(0);
  expect(req.ravOperadora).toBe(0);
  expect(req.valorCliente).toBe(0);
  expect(req.taxaServico).toBe(0);
});

test("paraRequest: localizador vazio (ou só espaço) vira null; espaços nas bordas são aparados", () => {
  expect(paraRequest({ ...reservaVazia(0), localizador: "   " }).localizador).toBeNull();
  expect(paraRequest({ ...reservaVazia(0), localizador: "  DCL-1  " }).localizador).toBe("DCL-1");
});

test("paraRequest: observações vazias (ou só espaço) viram null; espaços nas bordas são aparados", () => {
  expect(paraRequest({ ...reservaVazia(0), observacoes: "   " }).observacoes).toBeNull();
  expect(paraRequest({ ...reservaVazia(0), observacoes: "  nota  " }).observacoes).toBe("nota");
});
