import type { AbaConciliacao, FiltroConciliacao } from "@/api/financeiro";
import type { FornecedorDto } from "@/api/viagens";
import { Button, Input, Select } from "@/components";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Conciliacao.module.css";
import type { FiltroConciliacaoPatch } from "./useConciliacao";

const PREVISTO_OPCOES = [
  { value: "ate_hoje", label: "Até hoje" },
  { value: "semana", label: "Esta semana" },
];

interface FiltrosConciliacaoProps {
  filtro: FiltroConciliacao;
  aba: AbaConciliacao;
  definir: (patch: FiltroConciliacaoPatch) => void;
  fornecedores: FornecedorDto[];
  /** Barra de seleção do lote; `null` quando a aba não tem lote ou falta `financeiro.conciliar`. */
  lote: { quantidade: number; soma: number; onAbrir: () => void } | null;
}

export function FiltrosConciliacao({ filtro, aba, definir, fornecedores, lote }: FiltrosConciliacaoProps) {
  return (
    <div className={s.filtros}>
      <Select
        aria-label="Operadora"
        placeholder="Operadora: todas"
        options={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
        value={filtro.fornecedorId ?? ""}
        onChange={(e) => {
          definir({ fornecedorId: e.target.value || undefined });
        }}
      />
      {(aba === "pendentes" || aba === "atrasadas") && (
        <Select
          aria-label="Previsto"
          placeholder="Previsto: qualquer data"
          options={PREVISTO_OPCOES}
          value={filtro.previsto ?? ""}
          onChange={(e) => {
            definir({ previsto: (e.target.value || undefined) as FiltroConciliacao["previsto"] });
          }}
        />
      )}
      {aba === "recebidas" && (
        <Input
          type="month"
          aria-label="Mês"
          value={filtro.mes ?? ""}
          onChange={(e) => {
            definir({ mes: e.target.value || undefined });
          }}
        />
      )}
      {lote && (
        <>
          <span className={s.selecao}>
            {lote.quantidade} selecionadas · {formatarDinheiro(lote.soma)} · lote só para valor igual ao esperado
          </span>
          <Button variant="business" size="sm" disabled={lote.quantidade === 0} onClick={lote.onAbrir}>
            Marcar recebidas
          </Button>
        </>
      )}
    </div>
  );
}
