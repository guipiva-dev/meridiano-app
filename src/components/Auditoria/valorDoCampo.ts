import { apresentacaoStatus, type EntidadeStatus } from "@/dominio/status";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";

const CAMPOS_DINHEIRO = /^(valor|rav|taxa|multa)(_|$)/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;
// Auditoria não diz a entidade do campo: tenta os mapas nesta ordem e fica com o primeiro que conhece a chave.
// Chaves repetidas entre mapas têm o mesmo texto (cancelada, urgente, outro…), exceto `a_pagar`: repasse vence
// (despesa não grava `a_pagar` — é derivado de `pago`).
const ENTIDADES: EntidadeStatus[] = [
  "movimento_tipo",
  "fase_viagem",
  "reserva",
  "repasse",
  "comissao",
  "pendencia",
  "despesa",
  "nfse",
  "nfse_tomador",
  "credito",
  "desfecho",
  "prioridade",
  "acesso",
  "anexo_tipo",
  "documento_tipo",
  "grupo_tipo",
  "fornecedor_tipo",
  "canal",
  "despesa_categoria",
  "periodo",
  "forma_pagamento_despesa",
];

/** Chave de enum conhecida (§6.1) → rótulo humano; qualquer outro texto volta como está. */
export function rotuloDominio(valor: string): string {
  for (const entidade of ENTIDADES) {
    const texto = apresentacaoStatus(entidade, valor).texto;
    if (texto !== valor) return texto;
  }
  return valor;
}

/** Valor de `alteracoes` (auditoria): dinheiro nos campos monetários, booleano em Sim/Não, data ISO formatada, enum conhecido traduzido; o resto vira texto (JSON para objeto/array). */
export function valorDoCampo(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number" && CAMPOS_DINHEIRO.test(campo)) return formatarDinheiro(valor);
  if (typeof valor === "string" && DATA_ISO.test(valor)) return formatarData(valor);
  return typeof valor === "string" ? rotuloDominio(valor) : JSON.stringify(valor);
}
