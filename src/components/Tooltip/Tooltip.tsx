import type { ReactNode } from "react";
import { useId } from "react";
import s from "./Tooltip.module.css";

/**
 * Trigger vira <button>: passe ícone ou texto, nunca um Button/IconButton
 * (button aninhado é HTML inválido).
 */
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();
  const nome = typeof children === "string" ? undefined : text;
  return (
    <span className={s.wrap}>
      <button type="button" className={s.trigger} aria-describedby={id} aria-label={nome}>
        {children}
      </button>
      <span role="tooltip" id={id} className={s.bubble}>
        {text}
      </span>
    </span>
  );
}
