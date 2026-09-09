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
