import { rotuloDominio, valorDoCampo } from "./valorDoCampo";

test("campo `valor` (sem prefixo) e negativos saem como dinheiro", () => {
  expect(valorDoCampo("valor", -1550)).toBe("−R$ 1.550,00");
  expect(valorDoCampo("valor_comissao", 1000)).toBe("R$ 1.000,00");
  expect(valorDoCampo("rav", 50)).toBe("R$ 50,00");
});

test("chave de enum conhecida vira o rótulo humano; texto livre passa intacto", () => {
  expect(valorDoCampo("tipo", "pagamento_fornecedor")).toBe("Pagamento ao fornecedor");
  expect(valorDoCampo("status", "pendente")).toBe("Em emissão");
  expect(valorDoCampo("status", "a_pagar")).toBe("Liberado");
  expect(valorDoCampo("observacao", "pago em duas vezes")).toBe("pago em duas vezes");
});

test("data ISO vira dd/mm/aaaa", () => {
  expect(valorDoCampo("data_movimento", "2026-04-20")).toBe("20/04/2026");
});

test("rotuloDominio traduz subtítulo cru e devolve o resto como está", () => {
  expect(rotuloDominio("recebimento_operadora")).toBe("Recebimento da operadora");
  expect(rotuloDominio("CVC Operadora · K7X2PQ")).toBe("CVC Operadora · K7X2PQ");
});
