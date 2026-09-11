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
  janelas_sobrepostas: "janelas",
  documento_tipo_invalido: "tipo",
  validade_invalida: "validade",
  canal_invalido: "canal",
  resumo_obrigatorio: "resumo",
  data_invalida: "ocorridoEm",
  titulo_obrigatorio: "titulo",
  prioridade_invalida: "prioridade",
  passageiro_invalido: "viagemId",
};

export interface ErrosApi {
  campos: Record<string, string>;
  bloco: string | null;
  /** 409: alguém alterou o registro; a tela oferece recarregar. */
  conflito: boolean;
}

const VAZIO: ErrosApi = { campos: {}, bloco: null, conflito: false };

export function errosDeCadastro(erro: unknown): ErrosApi {
  if (erro === null || erro === undefined) return VAZIO;
  if (erro instanceof ConflictError) return { campos: {}, bloco: null, conflito: true };
  if (erro instanceof ValidationError) {
    const campo = CAMPO_POR_CODIGO[erro.codigo];
    if (campo) return { campos: { [campo]: erro.detalhe }, bloco: null, conflito: false };
  }
  return { campos: {}, bloco: mensagemDeErro(erro), conflito: false };
}
