import { apresentacaoStatus } from "./status";

test("fases da viagem têm o texto da spec §6.1", () => {
  expect(apresentacaoStatus("fase_viagem", "sem_reserva")).toEqual({ texto: "Rascunho", tone: "neutral" });
  expect(apresentacaoStatus("fase_viagem", "em_emissao")).toEqual({ texto: "Em emissão", tone: "info" });
  expect(apresentacaoStatus("fase_viagem", "cancelada").tone).toBe("danger");
});

test("comissão atrasada é danger, recebida é success", () => {
  expect(apresentacaoStatus("comissao", "atrasada")).toEqual({ texto: "Atrasada", tone: "danger" });
  expect(apresentacaoStatus("comissao", "recebida").tone).toBe("success");
});

test("reserva pendente aparece como Em emissão", () => {
  expect(apresentacaoStatus("reserva", "pendente").texto).toBe("Em emissão");
});

test("repasse a_pagar é Liberado", () => {
  expect(apresentacaoStatus("repasse", "a_pagar")).toEqual({ texto: "Liberado", tone: "warning" });
});

test("valor desconhecido não quebra", () => {
  expect(apresentacaoStatus("reserva", "xyz")).toEqual({ texto: "xyz", tone: "neutral" });
});

test("nfse falta_emitir é warning; emitido é success; nao_precisa é neutral", () => {
  expect(apresentacaoStatus("nfse", "falta_emitir")).toEqual({ texto: "Falta emitir", tone: "warning" });
  expect(apresentacaoStatus("nfse", "emitido")).toEqual({ texto: "Emitida", tone: "success" });
  expect(apresentacaoStatus("nfse", "nao_precisa")).toEqual({ texto: "Não precisa", tone: "neutral" });
});

test("crédito disponível é success, utilizado neutral, expirado danger", () => {
  expect(apresentacaoStatus("credito", "disponivel")).toEqual({ texto: "Disponível", tone: "success" });
  expect(apresentacaoStatus("credito", "utilizado")).toEqual({ texto: "Utilizado", tone: "neutral" });
  expect(apresentacaoStatus("credito", "expirado")).toEqual({ texto: "Expirado", tone: "danger" });
});

test("prioridade urgente é danger", () => {
  expect(apresentacaoStatus("prioridade", "normal")).toEqual({ texto: "Normal", tone: "neutral" });
  expect(apresentacaoStatus("prioridade", "urgente")).toEqual({ texto: "Urgente", tone: "danger" });
});

test("desfecho de cancelamento: crédito é a única variante de sucesso", () => {
  expect(apresentacaoStatus("desfecho", "sem_reembolso")).toEqual({ texto: "Sem reembolso", tone: "neutral" });
  expect(apresentacaoStatus("desfecho", "reembolso")).toEqual({ texto: "Reembolso", tone: "info" });
  expect(apresentacaoStatus("desfecho", "credito")).toEqual({ texto: "Crédito", tone: "success" });
});

test("nfse_tomador e anexo_tipo rotulam em português", () => {
  expect(apresentacaoStatus("nfse_tomador", "operadora").texto).toBe("Operadora");
  expect(apresentacaoStatus("anexo_tipo", "comprovante").texto).toBe("Comprovante");
});

test("movimento_tipo: entrada é success, saída warning, estorno/reembolso danger", () => {
  expect(apresentacaoStatus("movimento_tipo", "recebimento_operadora")).toEqual({
    texto: "Recebimento da operadora",
    tone: "success",
  });
  expect(apresentacaoStatus("movimento_tipo", "pagamento_fornecedor")).toEqual({
    texto: "Pagamento ao fornecedor",
    tone: "warning",
  });
  expect(apresentacaoStatus("movimento_tipo", "estorno_operadora").tone).toBe("danger");
  expect(apresentacaoStatus("movimento_tipo", "reembolso_cliente").tone).toBe("danger");
});

test("período: aberto info, pendências warning, fechado success", () => {
  expect(apresentacaoStatus("periodo", "aberto")).toEqual({ texto: "Aberto", tone: "info" });
  expect(apresentacaoStatus("periodo", "pendencias")).toEqual({ texto: "Pendências", tone: "warning" });
  expect(apresentacaoStatus("periodo", "fechado")).toEqual({ texto: "Fechado", tone: "success" });
});
