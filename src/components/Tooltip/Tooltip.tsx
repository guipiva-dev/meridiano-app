import type { ReactNode } from "react";
import { useId } from "react";
import s from "./Tooltip.module.css";

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();
  return (
    <button type="button" className={s.wrap} aria-describedby={id}>
      {children}
      <span role="tooltip" id={id} className={s.bubble}>
        {text}
      </span>
    </button>
  );
}
