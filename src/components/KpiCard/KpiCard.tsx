import type { ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { cx } from "@/lib/cx";
import s from "./KpiCard.module.css";

export function KpiCard({
  label,
  value,
  contexto,
  actionLabel,
  onAction,
  tone = "normal",
}: {
  label: string;
  value: ReactNode;
  contexto?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "normal" | "warning" | "danger";
}) {
  return (
    <div className={cx(s.card, s[tone])}>
      <span className={s.label}>{label}</span>
      <span className={s.value}>{value}</span>
      {contexto && <span className={s.contexto}>{contexto}</span>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" className={s.action} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
