import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";

/** 422 cujo `codigo` aponta para um campo da tela. O resto vira Alert de bloco. */
const CAMPO_POR_CODIGO: Record<string, string> = {
  destino_obrigatorio: "destino",
  titular_obrigatorio: "passageiros",
  sem_passageiro: "passageiros",
  passageiro_duplicado: "passageiros",
  titular_duplicado: "passageiros",
  datas_incoerentes: "dataVolta",
  repasse_sem_vendedor: "repasseValor",
  valor_negativo: "repasseValor",
  usuario_inativo: "vendedorId",
};

export interface ErrosApi {
  campos: Record<string, string>;
  bloco: string | null;
  /** 409: alguém alterou a viagem; a tela oferece recarregar. */
  conflito: boolean;
}

const VAZIO: ErrosApi = { campos: {}, bloco: null, conflito: false };

export function errosDeApi(erro: unknown): ErrosApi {
  if (erro === null || erro === undefined) return VAZIO;
  if (erro instanceof ConflictError) return { campos: {}, bloco: null, conflito: true };
  if (erro instanceof ValidationError) {
    const campo = CAMPO_POR_CODIGO[erro.codigo];
    if (campo) return { campos: { [campo]: erro.detalhe }, bloco: null, conflito: false };
  }
  return { campos: {}, bloco: mensagemDeErro(erro), conflito: false };
}
