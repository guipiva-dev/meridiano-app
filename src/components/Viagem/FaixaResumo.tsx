import { CircleHelp } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { MoneyValue } from "@/components/Input/MoneyValue";
import { Tooltip } from "@/components/Tooltip/Tooltip";
import { cx } from "@/lib/cx";
import s from "./Viagem.module.css";

export interface ItemFaixa {
  label: string;
  value: number | null | undefined;
  tooltip?: string;
  destaque?: boolean;
  badge?: ReactNode;
}

/** Versão de leitura da faixa de resumo (protótipo: "summary-strip"); TripSummary continua para o formulário. */
export function FaixaResumo({ itens, extra }: { itens: ItemFaixa[]; extra?: { label: string; value: number } }) {
  return (
    <div className={s.summaryStrip}>
      {itens.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span className={s.sep} aria-hidden />}
          <div className={s.item}>
            <small>
              {item.label}
              {item.tooltip && (
                <Tooltip text={item.tooltip}>
                  <CircleHelp size={16} aria-hidden />
                </Tooltip>
              )}
            </small>
            <MoneyValue value={item.value ?? null} emphasis={item.destaque ? "result" : "normal"} />
            {item.badge}
          </div>
        </Fragment>
      ))}
      {extra && (
        <>
          <span className={s.sep} aria-hidden />
          <div className={cx(s.item, s.extra)}>
            <small>{extra.label}</small>
            <MoneyValue value={extra.value} />
          </div>
        </>
      )}
    </div>
  );
}
