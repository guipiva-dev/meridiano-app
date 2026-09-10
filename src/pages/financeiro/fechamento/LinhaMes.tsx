import type { PeriodoDto } from "@/api/fechamento";
import { Button } from "@/components";
import { Badge, StatusBadge } from "@/components/display";
import { formatarData, nomeMes } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Fechamento.module.css";

interface LinhaMesProps {
  periodo: PeriodoDto;
  podeFechar: boolean;
  podeReabrir: boolean;
  onFechar: () => void;
  onReabrir: () => void;
}

/** Competência yyyy-mm → "Abril" (nomeMes traz "Abril de 2026"). */
function mesSemAno(competencia: string): string {
  return nomeMes(competencia).split(" de ")[0] ?? "";
}

export function LinhaMes({ periodo, podeFechar, podeReabrir, onFechar, onReabrir }: LinhaMesProps) {
  const mes = mesSemAno(periodo.competencia);
  const fechado = periodo.status === "fechado";
  const meta = periodo.corrente
    ? "em andamento"
    : fechado
      ? `fechado em ${formatarData(periodo.fechadoEm).slice(0, 5)} por ${periodo.fechadoPorNome ?? "—"}`
      : `${periodo.reservas} reservas · ${periodo.comissoesPendentes} comissões pendentes · ${periodo.despesas} despesas`;

  return (
    <div className={s.linha}>
      <b className={s.mes}>{mes}</b>
      <span className={s.meta}>{meta}</span>
      <span className={s.valor}>{formatarDinheiro(periodo.receitaPrevista)} prevista</span>
      <span className={s.valor}>{formatarDinheiro(periodo.receitaRecebida)} recebida</span>
      {periodo.corrente ? <Badge tone="info">aberto</Badge> : <StatusBadge entidade="periodo" valor={periodo.status} />}
      <div className={s.acoes}>
        {!periodo.corrente && !fechado && podeFechar && (
          <Button variant="primary" size="sm" onClick={onFechar}>
            Fechar {mes}…
          </Button>
        )}
        {fechado && podeReabrir && (
          <Button variant="tertiary" size="sm" onClick={onReabrir}>
            Reabrir…
          </Button>
        )}
      </div>
    </div>
  );
}
