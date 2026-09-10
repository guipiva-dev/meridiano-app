import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { CategoriaDespesa, DespesaDto, FiltroDespesas, SituacaoDespesa } from "@/api/despesas";
import { competenciaAtual } from "@/lib/datas";

export interface FiltroDespesasPatch {
  mes?: string;
  categoria?: CategoriaDespesa;
  situacao?: SituacaoDespesa;
  soVinculadas?: boolean;
  pagina?: number;
}

export type ModalDespesas =
  | { tipo: "nova" }
  | { tipo: "editar"; despesa: DespesaDto }
  | { tipo: "pagar"; despesa: DespesaDto }
  | { tipo: "excluir"; despesa: DespesaDto };

/** Filtro das despesas na URL (voltar/compartilhar, mesma receita de `useConciliacao`). */
export function useDespesas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalDespesas | null>(null);

  const filtro: FiltroDespesas = {
    mes: searchParams.get("mes") ?? competenciaAtual(),
    categoria: (searchParams.get("categoria") as CategoriaDespesa | null) ?? undefined,
    situacao: (searchParams.get("situacao") as SituacaoDespesa | null) ?? undefined,
    soVinculadas: searchParams.get("soVinculadas") === "1" || undefined,
    pagina: Number(searchParams.get("pagina") ?? "1") || 1,
  };

  function definir(patch: FiltroDespesasPatch) {
    setSearchParams((prev) => {
      const proximos = new URLSearchParams(prev);
      for (const [chave, valor] of Object.entries(patch)) {
        proximos.delete(chave);
        if (valor === undefined || valor === "" || valor === false) continue;
        proximos.set(chave, valor === true ? "1" : String(valor));
      }
      if (!("pagina" in patch)) proximos.set("pagina", "1");
      return proximos;
    });
  }

  function abrir(m: ModalDespesas) {
    setModal(m);
  }

  function fechar() {
    setModal(null);
  }

  /** Depois de qualquer mutação: a lista de despesas muda e a viagem ligada também (resultado recalculado). */
  function invalidar() {
    void qc.invalidateQueries({ queryKey: ["despesas"] });
    void qc.invalidateQueries({ queryKey: ["viagens"] });
  }

  return { filtro, definir, modal, abrir, fechar, invalidar };
}
