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
  /** Excedente (R$) de um 422 `recebimento_acima_esperado`; null quando não há aviso pendente. */
  excedente: number | null;
  /** true quando o servidor recusou por faltar a confirmação do excedente: o modal avisa e foca a checkbox. */
  precisaConfirmarExcedente: boolean;
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
  const [excedente, setExcedente] = useState<number | null>(null);
  const [precisaConfirmarExcedente, setPrecisaConfirmarExcedente] = useState(false);

  function limpar() {
    setSalvando(false);
    setErros({});
    setErroBloco(null);
    setConflito(false);
    setPrecisaMotivo(false);
    setMotivo("");
    setExcedente(null);
    setPrecisaConfirmarExcedente(false);
  }

  async function enviar(args: TArgs): Promise<TRes | null> {
    setErros({});
    setErroBloco(null);
    setConflito(false);
    setExcedente(null);
    setPrecisaConfirmarExcedente(false);
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
        // texto_longo é genérico: o campo vem em extensions.campo (um código, N campos), como em mapaErrosCadastro.
        const campo =
          erro.codigo === "texto_longo" && typeof erro.extensions.campo === "string"
            ? erro.extensions.campo
            : mapa[erro.codigo];
        if (erro.codigo === "periodo_fechado") {
          setErroBloco(ERRO_PERIODO_FECHADO);
        } else if (erro.codigo === "recebimento_acima_esperado") {
          const valor = erro.extensions.excedente;
          if (typeof valor === "number" && valor > 0) {
            setExcedente(valor);
            setPrecisaConfirmarExcedente(true);
          } else {
            setErroBloco(erro.detalhe);
          }
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

  return {
    salvando,
    erros,
    erroBloco,
    conflito,
    precisaMotivo,
    motivo,
    setMotivo,
    excedente,
    precisaConfirmarExcedente,
    enviar,
    limpar,
  };
}
