import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import s from "./Chip.module.css";

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  selected: boolean;
}

export function Chip({ selected, children, className, ...rest }: ChipProps) {
  return (
    <button type="button" aria-pressed={selected} className={cx(s.chip, selected && s.on, className)} {...rest}>
      {selected && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}
