export type Tone = "info" | "success" | "warning" | "danger" | "neutral";
export interface Apresentacao {
  texto: string;
  tone: Tone;
}

type Mapa = Record<string, Apresentacao>;

const fase_viagem: Mapa = {
  sem_reserva: { texto: "Rascunho", tone: "neutral" },
  em_emissao: { texto: "Em emissão", tone: "info" },
  confirmada: { texto: "Confirmada", tone: "info" },
  em_viagem: { texto: "Em viagem", tone: "info" },
  concluida: { texto: "Concluída", tone: "success" },
  cancelada: { texto: "Cancelada", tone: "danger" },
};
const comissao: Mapa = {
  nao_prevista: { texto: "Não prevista", tone: "neutral" },
  a_receber: { texto: "A receber", tone: "info" },
  parcial: { texto: "Parcial", tone: "warning" },
  atrasada: { texto: "Atrasada", tone: "danger" },
  recebida: { texto: "Recebida", tone: "success" },
  divergente: { texto: "Divergente", tone: "warning" },
};
const reserva: Mapa = {
  pendente: { texto: "Em emissão", tone: "info" },
  emitida: { texto: "Emitida", tone: "success" },
  cancelada: { texto: "Cancelada", tone: "danger" },
};
const repasse: Mapa = {
  bloqueado: { texto: "Bloqueado", tone: "neutral" },
  a_pagar: { texto: "Liberado", tone: "warning" },
  pago: { texto: "Pago", tone: "success" },
};
const despesa: Mapa = {
  a_pagar: { texto: "A pagar", tone: "info" },
  vencida: { texto: "Vencida", tone: "danger" },
  paga: { texto: "Paga", tone: "success" },
};
const pendencia: Mapa = {
  aberta: { texto: "Aberta", tone: "info" },
  urgente: { texto: "Urgente", tone: "danger" },
  atrasada: { texto: "Atrasada", tone: "danger" },
  concluida: { texto: "Concluída", tone: "success" },
  cancelada: { texto: "Cancelada", tone: "neutral" },
};
const acesso: Mapa = {
  acesso_ativo: { texto: "Acesso ativo", tone: "success" },
  sem_acesso: { texto: "Sem acesso", tone: "neutral" },
  convite_pendente: { texto: "Convite pendente", tone: "warning" },
  inativo: { texto: "Inativo", tone: "neutral" },
};

const mapas = { fase_viagem, comissao, reserva, repasse, despesa, pendencia, acesso } as const;
export type EntidadeStatus = keyof typeof mapas;

export function apresentacaoStatus(entidade: EntidadeStatus, valor: string): Apresentacao {
  return mapas[entidade][valor] ?? { texto: valor, tone: "neutral" };
}
