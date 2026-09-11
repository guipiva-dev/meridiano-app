import { FORMAS_PAGAMENTO } from "@/api/financeiro";
import { apresentacaoStatus } from "@/dominio/status";

/** Código 422 do back → nome do campo do formulário (o resto vira erro de bloco). */
export const CAMPO_POR_CODIGO_FIN: Record<string, string> = {
  tipo_invalido: "tipo",
  valor_invalido: "valor",
  forma_invalida: "formaPagamento",
  data_invalida: "data",
  motivo_obrigatorio: "motivo",
  descricao_obrigatoria: "descricao",
  categoria_invalida: "categoria",
  pagamento_incompleto: "formaPagamento",
  referencia_invalida: "viagemId",
  repasse_sem_valor: "valor",
};

export const ERRO_PERIODO_FECHADO = "Período fechado. Só Dono ou Financeiro alteram com motivo.";

/** Opções do `Select` de forma de pagamento, compartilhadas por todos os modais de dinheiro. */
export const OPCOES_FORMA = FORMAS_PAGAMENTO.map((f) => ({
  value: f,
  label: apresentacaoStatus("forma_pagamento_despesa", f).texto,
}));
