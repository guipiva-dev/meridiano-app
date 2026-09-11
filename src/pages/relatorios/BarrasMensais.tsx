import type { CSSProperties } from "react";
import type { ReceitaMesDto } from "@/api/relatorios";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Relatorios.module.css";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function altura(valor: number, max: number): number {
  if (max <= 0) return 0;
  return (Math.max(valor, 0) / max) * 100;
}

/** Barras mensais prevista (clara) × recebida (escura). Negativo (estorno) some visualmente (altura 0) mas o `title` guarda o valor real. */
export function BarrasMensais({ meses }: { meses: ReceitaMesDto[] }) {
  const max = Math.max(0, ...meses.flatMap((m) => [Math.max(m.prevista, 0), Math.max(m.recebida, 0)]));

  return (
    <div className={s.grafico}>
      {meses.map((m) => {
        const rotulo = MESES[m.mes - 1] ?? String(m.mes);
        return (
          <div
            key={m.mes}
            role="group"
            aria-label={`${rotulo}: prevista ${formatarDinheiro(m.prevista)}, recebida ${formatarDinheiro(m.recebida)}`}
            className={s.coluna}
          >
            <div className={s.barras}>
              <span
                data-barra="prevista"
                className={s.barraPrevista}
                style={{ "--altura": altura(m.prevista, max) } as CSSProperties}
                title={formatarDinheiro(m.prevista)}
              />
              <span
                data-barra="recebida"
                className={s.barraRecebida}
                style={{ "--altura": altura(m.recebida, max) } as CSSProperties}
                title={formatarDinheiro(m.recebida)}
              />
            </div>
            <span className={s.rotuloMes}>{rotulo}</span>
          </div>
        );
      })}
    </div>
  );
}
