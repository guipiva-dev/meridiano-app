import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { AbaConciliacao, ConciliacaoItemDto, FiltroConciliacao } from "@/api/financeiro";
import { competenciaAtual } from "@/lib/datas";

export interface FiltroConciliacaoPatch {
  aba?: AbaConciliacao;
  fornecedorId?: string;
  previsto?: FiltroConciliacao["previsto"];
  mes?: string;
  pagina?: number;
}

export type ModalConciliacao =
  | { tipo: "receber"; item: ConciliacaoItemDto }
  | { tipo: "divergencia"; item: ConciliacaoItemDto }
  | { tipo: "lote" };

/**
 * Filtro da conciliação na URL (voltar/compartilhar, mesma receita de `useFiltrosViagens`).
 * Seleção e modal são estado local: não sobrevivem ao recarregar e nem deveriam.
 */
export function useConciliacao() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [selecionados, setSelecionados] = useState<ReadonlySet<string>>(new Set());
  const [modal, setModal] = useState<ModalConciliacao | null>(null);

  const aba = (searchParams.get("aba") as AbaConciliacao | null) ?? "pendentes";
  const filtro: FiltroConciliacao = {
    aba,
    fornecedorId: searchParams.get("fornecedorId") ?? undefined,
    previsto: (searchParams.get("previsto") as FiltroConciliacao["previsto"] | null) ?? undefined,
    mes: searchParams.get("mes") ?? competenciaAtual(),
    pagina: Number(searchParams.get("pagina") ?? "1") || 1,
  };

  function limparSelecao() {
    setSelecionados(new Set());
  }

  function definir(patch: FiltroConciliacaoPatch) {
    const trocouAba = patch.aba !== undefined && patch.aba !== aba;
    if (trocouAba) limparSelecao();
    setSearchParams((prev) => {
      const proximos = new URLSearchParams(prev);
      // Previsto só existe em pendentes/atrasadas; carregá-lo para outra aba filtraria escondido.
      if (trocouAba) proximos.delete("previsto");
      for (const [chave, valor] of Object.entries(patch)) {
        proximos.delete(chave);
        if (valor === undefined || valor === "") continue;
        proximos.set(chave, String(valor));
      }
      if (!("pagina" in patch)) proximos.set("pagina", "1");
      return proximos;
    });
  }

  function limpar() {
    limparSelecao();
    setSearchParams(new URLSearchParams());
  }

  function alternar(reservaId: string) {
    setSelecionados((atual) => {
      const proximos = new Set(atual);
      if (!proximos.delete(reservaId)) proximos.add(reservaId);
      return proximos;
    });
  }

  function abrir(m: ModalConciliacao) {
    setModal(m);
  }

  function fechar() {
    setModal(null);
  }

  /** Depois de qualquer movimento: a conciliação muda e a viagem/reserva também (repasse reavaliado). */
  function aplicarMovimento() {
    limparSelecao();
    void qc.invalidateQueries({ queryKey: ["conciliacao"] });
    void qc.invalidateQueries({ queryKey: ["viagens"] });
  }

  return { filtro, definir, limpar, selecionados, alternar, limparSelecao, modal, abrir, fechar, aplicarMovimento };
}
