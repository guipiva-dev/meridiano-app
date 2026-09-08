import { cx } from "@/lib/cx";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./MoneyValue.module.css";

interface MoneyValueProps {
  value: number | null;
  emphasis?: "normal" | "result";
  tone?: "normal" | "above" | "negative";
  className?: string;
}

export function MoneyValue({ value, emphasis = "normal", tone, className }: MoneyValueProps) {
  const t = tone ?? (value !== null && value < 0 ? "negative" : "normal");
  return (
    <span className={cx(s.value, emphasis === "result" && s.result, s[t], className)}>
      {formatarDinheiro(value) || "—"}
    </span>
  );
}
