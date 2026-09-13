import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";

/** 422 cujo `codigo` aponta para um campo das telas de cadastro (cliente/grupo/fornecedor/documento/atendimento). */
export const CAMPO_POR_CODIGO: Record<string, string> = {
  nome_obrigatorio: "nome",
  cpf_invalido: "cpf",
  cpf_duplicado: "cpf",
  uf_invalida: "uf",
  data_nascimento_invalida: "dataNascimento",
  email_invalido: "email",
  referencia_invalida: "grupoId",
  grupo_tipo_invalido: "tipo",
  cnpj_invalido: "cnpj",
  tipo_invalido: "tipo",
  percentual_invalido: "percentualComissaoPadrao",
  prazo_invalido: "prazoComissaoDias",
  vigencia_invalida: "vigenteDesde",
  janelas_obrigatorias: "janelas",
  janela_invalida: "janelas",
  // B6: `janelas_incompletas` substitui `janelas_sobrepostas` (removido).
  janelas_incompletas: "janelas",
  documento_tipo_invalido: "tipo",
  validade_invalida: "validade",
  canal_invalido: "canal",
  resumo_obrigatorio: "resumo",
  data_invalida: "ocorridoEm",
  titulo_obrigatorio: "titulo",
  prioridade_invalida: "prioridade",
  passageiro_invalido: "viagemId",
  telefone_invalido: "telefone",
  telefone_emergencia_invalido: "telefoneEmergencia",
  numero_obrigatorio: "numero",
  site_invalido: "site",
  whatsapp_invalido: "whatsapp",
  // Nome duplicado de fornecedor/grupo: 422 (RegraDeNegocioException) é o caminho normal.
  fornecedor_duplicado: "nome",
  grupo_duplicado: "nome",
};

export interface ErrosApi {
  campos: Record<string, string>;
  bloco: string | null;
  /** 409: alguém alterou o registro; a tela oferece recarregar. */
  conflito: boolean;
}

const VAZIO: ErrosApi = { campos: {}, bloco: null, conflito: false };

/**
 * 409 que não é conflito de concorrência (xmin): nome duplicado de fornecedor/grupo.
 * Caminho normal é 422 (ver `CAMPO_POR_CODIGO`); isto cobre a corrida rara em que o índice único do banco
 * dispara antes da checagem da regra de negócio, chegando como 409 (código específico ou o genérico `duplicado`).
 */
const CODIGOS_NOME_DUPLICADO_CONFLITO = new Set(["fornecedor_duplicado", "grupo_duplicado", "duplicado"]);

export function errosDeCadastro(erro: unknown): ErrosApi {
  if (erro === null || erro === undefined) return VAZIO;
  if (erro instanceof ConflictError) {
    if (CODIGOS_NOME_DUPLICADO_CONFLITO.has(erro.codigo)) {
      return { campos: { nome: erro.detalhe }, bloco: null, conflito: false };
    }
    return { campos: {}, bloco: null, conflito: true };
  }
  if (erro instanceof ValidationError) {
    // texto_longo (B4) é genérico: o campo vem em extensions.campo, não em CAMPO_POR_CODIGO (um código, N campos).
    if (erro.codigo === "texto_longo") {
      const campo = erro.extensions.campo;
      if (typeof campo === "string") return { campos: { [campo]: erro.detalhe }, bloco: null, conflito: false };
    }
    const campo = CAMPO_POR_CODIGO[erro.codigo];
    if (campo) return { campos: { [campo]: erro.detalhe }, bloco: null, conflito: false };
  }
  return { campos: {}, bloco: mensagemDeErro(erro), conflito: false };
}
