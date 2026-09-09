import { useState } from "react";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import type { ViagemDto } from "@/api/viagens";

interface ResultadoOperacao<TReq> {
  salvando: boolean;
  erros: Record<string, string>;
  erroBloco: string | null;
  conflito: boolean;
  enviar: (req: TReq) => Promise<ViagemDto | null>;
  limpar: () => void;
}

/**
 * Receita comum dos modais de operação: estado saving/error, 409 → conflito, 422 → erro de
 * campo (via `mapa` codigo→campo) ou bloco. Sucesso devolve o DTO; o chamador fecha o modal e
 * atualiza o cache (`queryClient.setQueryData`) — este hook não toca a query.
 */
export function useOperacao<TReq>(
  executar: (req: TReq) => Promise<ViagemDto>,
  mapa: Record<string, string>,
): ResultadoOperacao<TReq> {
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [conflito, setConflito] = useState(false);

  function limpar() {
    setSalvando(false);
    setErros({});
    setErroBloco(null);
    setConflito(false);
  }

  async function enviar(req: TReq): Promise<ViagemDto | null> {
    setErros({});
    setErroBloco(null);
    setConflito(false);
    setSalvando(true);
    try {
      const dto = await executar(req);
      setSalvando(false);
      return dto;
    } catch (erro) {
      setSalvando(false);
      if (erro instanceof ConflictError) {
        setConflito(true);
      } else if (erro instanceof ValidationError) {
        const campo = mapa[erro.codigo];
        if (campo) setErros({ [campo]: erro.detalhe });
        else setErroBloco(mensagemDeErro(erro));
      } else {
        setErroBloco(mensagemDeErro(erro));
      }
      return null;
    }
  }

  return { salvando, erros, erroBloco, conflito, enviar, limpar };
}
