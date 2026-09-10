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

const nfse: Mapa = {
  falta_emitir: { texto: "Falta emitir", tone: "warning" },
  emitido: { texto: "Emitida", tone: "success" },
  nao_precisa: { texto: "Não precisa", tone: "neutral" },
};

const credito: Mapa = {
  disponivel: { texto: "Disponível", tone: "success" },
  utilizado: { texto: "Utilizado", tone: "neutral" },
  expirado: { texto: "Expirado", tone: "danger" },
};

const prioridade: Mapa = {
  normal: { texto: "Normal", tone: "neutral" },
  urgente: { texto: "Urgente", tone: "danger" },
};

const desfecho: Mapa = {
  sem_reembolso: { texto: "Sem reembolso", tone: "neutral" },
  reembolso: { texto: "Reembolso", tone: "info" },
  credito: { texto: "Crédito", tone: "success" },
};

const nfse_tomador: Mapa = {
  cliente: { texto: "Cliente", tone: "neutral" },
  operadora: { texto: "Operadora", tone: "neutral" },
};

const anexo_tipo: Mapa = {
  voucher: { texto: "Voucher", tone: "neutral" },
  comprovante: { texto: "Comprovante", tone: "neutral" },
  documento: { texto: "Documento", tone: "neutral" },
  contrato: { texto: "Contrato", tone: "neutral" },
  extrato: { texto: "Extrato", tone: "neutral" },
  outro: { texto: "Outro", tone: "neutral" },
};

const documento_tipo: Mapa = {
  rg: { texto: "RG", tone: "neutral" },
  cpf: { texto: "CPF", tone: "neutral" },
  passaporte: { texto: "Passaporte", tone: "neutral" },
  visto: { texto: "Visto", tone: "neutral" },
  certidao: { texto: "Certidão", tone: "neutral" },
  outro: { texto: "Outro", tone: "neutral" },
};

const grupo_tipo: Mapa = {
  familia: { texto: "Família", tone: "neutral" },
  empresa: { texto: "Empresa", tone: "info" },
  outro: { texto: "Outro", tone: "neutral" },
};

const fornecedor_tipo: Mapa = {
  operadora: { texto: "Operadora", tone: "neutral" },
  consolidadora: { texto: "Consolidadora", tone: "neutral" },
  cia_aerea: { texto: "Cia aérea", tone: "neutral" },
  hotel: { texto: "Hotel", tone: "neutral" },
  seguradora: { texto: "Seguradora", tone: "neutral" },
  receptivo: { texto: "Receptivo", tone: "neutral" },
  despachante: { texto: "Despachante", tone: "neutral" },
  outro: { texto: "Outro", tone: "neutral" },
};

const canal: Mapa = {
  whatsapp: { texto: "WhatsApp", tone: "neutral" },
  ligacao: { texto: "Ligação", tone: "neutral" },
  presencial: { texto: "Presencial", tone: "neutral" },
  email: { texto: "E-mail", tone: "neutral" },
  outro: { texto: "Outro", tone: "neutral" },
};

const movimento_tipo: Mapa = {
  recebimento_operadora: { texto: "Recebimento da operadora", tone: "success" },
  recebimento_cliente: { texto: "Recebimento do cliente", tone: "success" },
  pagamento_fornecedor: { texto: "Pagamento ao fornecedor", tone: "warning" },
  estorno_operadora: { texto: "Estorno da operadora", tone: "danger" },
  reembolso_cliente: { texto: "Reembolso ao cliente", tone: "danger" },
};

const despesa_categoria: Mapa = {
  fixo: { texto: "Fixo", tone: "neutral" },
  imposto: { texto: "Imposto", tone: "neutral" },
  operacional: { texto: "Operacional", tone: "neutral" },
  marketing: { texto: "Marketing", tone: "neutral" },
  outro: { texto: "Outro", tone: "neutral" },
};

const periodo: Mapa = {
  aberto: { texto: "Aberto", tone: "info" },
  pendencias: { texto: "Pendências", tone: "warning" },
  fechado: { texto: "Fechado", tone: "success" },
};

const forma_pagamento_despesa: Mapa = {
  pix: { texto: "PIX", tone: "neutral" },
  boleto: { texto: "Boleto", tone: "neutral" },
  cartao: { texto: "Cartão", tone: "neutral" },
  transferencia: { texto: "Transferência", tone: "neutral" },
  dinheiro: { texto: "Dinheiro", tone: "neutral" },
};

const mapas = {
  fase_viagem,
  comissao,
  reserva,
  repasse,
  despesa,
  pendencia,
  acesso,
  nfse,
  credito,
  prioridade,
  desfecho,
  nfse_tomador,
  anexo_tipo,
  documento_tipo,
  grupo_tipo,
  fornecedor_tipo,
  canal,
  movimento_tipo,
  despesa_categoria,
  periodo,
  forma_pagamento_despesa,
} as const;
export type EntidadeStatus = keyof typeof mapas;

export function apresentacaoStatus(entidade: EntidadeStatus, valor: string): Apresentacao {
  return mapas[entidade][valor] ?? { texto: valor, tone: "neutral" };
}
