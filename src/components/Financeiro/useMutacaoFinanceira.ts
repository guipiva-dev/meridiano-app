import { useState } from "react";
import { ConflictError, mensagemDeErro, ValidationError } from "@/api/errors";
import { ERRO_PERIODO_FECHADO } from "./mapaErrosFinanceiro";

export interface ResultadoMutacao<TArgs, TRes> {
  salvando: boolean;
  erros: Record<string, string>;
  erroBloco: string | null;
  conflito: boolean;
  precisaMotivo: boolean;
  motivo: string;
  setMotivo: (m: string) => void;
  enviar: (args: TArgs) => Promise<TRes | null>;
  limpar: () => void;
}

/**
 * Receita dos modais de dinheiro (R9). Como `useOperacao` (3.3), mais o retry com motivo:
 * 422 `motivo_obrigatorio` liga `precisaMotivo`, o modal renderiza `<MotivoField/>` ligado a
 * `motivo`/`setMotivo` e o próximo `enviar` manda o mesmo `args` já com o motivo no header.
 * 422 `periodo_fechado` é bloqueio (falta permissão), não pedido de motivo.
 */
export function useMutacaoFinanceira<TArgs, TRes>(
  executar: (args: TArgs, motivo?: string) => Promise<TRes>,
  mapa: Record<string, string>,
): ResultadoMutacao<TArgs, TRes> {
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroBloco, setErroBloco] = useState<string | null>(null);
  const [conflito, setConflito] = useState(false);
  const [precisaMotivo, setPrecisaMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");

  function limpar() {
    setSalvando(false);
    setErros({});
    setErroBloco(null);
    setConflito(false);
    setPrecisaMotivo(false);
    setMotivo("");
  }

  async function enviar(args: TArgs): Promise<TRes | null> {
    setErros({});
    setErroBloco(null);
    setConflito(false);
    setSalvando(true);
    try {
      const res = await executar(args, motivo.trim() || undefined);
      setSalvando(false);
      return res;
    } catch (erro) {
      setSalvando(false);
      if (erro instanceof ConflictError) {
        setConflito(true);
      } else if (erro instanceof ValidationError) {
        const campo = mapa[erro.codigo];
        if (erro.codigo === "periodo_fechado") {
          setErroBloco(ERRO_PERIODO_FECHADO);
        } else if (erro.codigo === "motivo_obrigatorio") {
          // Primeira recusa só revela o campo; erro embaixo dele só depois que o usuário tentou com motivo.
          if (precisaMotivo) setErros({ motivo: erro.detalhe });
          setPrecisaMotivo(true);
        } else if (campo) {
          setErros({ [campo]: erro.detalhe });
        } else {
          setErroBloco(mensagemDeErro(erro));
        }
      } else {
        setErroBloco(mensagemDeErro(erro));
      }
      return null;
    }
  }

  return { salvando, erros, erroBloco, conflito, precisaMotivo, motivo, setMotivo, enviar, limpar };
}
