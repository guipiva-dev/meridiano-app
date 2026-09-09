import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { cx } from "@/lib/cx";
import s from "./Tabs.module.css";

export interface Tab {
  id: string;
  label: string;
  count?: number;
}
interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  children: ReactNode;
}

export function Tabs({ tabs, active, onChange, children }: TabsProps) {
  const lista = useRef<HTMLDivElement>(null);
  if (import.meta.env.DEV && tabs.length > 6) console.warn("Tabs: máximo 6 (contrato §4.5)");
  function teclas(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active);
    if (i < 0) return;
    const prox =
      e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : -1;
    if (prox < 0) return;
    const alvo = tabs[prox];
    if (!alvo) return;
    e.preventDefault();
    onChange(alvo.id);
    lista.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[prox]?.focus();
  }
  return (
    <div className={s.wrap}>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- foco fica nos botões [role=tab] (roving tabindex); o tablist em si não recebe foco no padrão WAI-ARIA APG */}
      <div ref={lista} role="tablist" className={s.list} onKeyDown={teclas}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`panel-${t.id}`}
            tabIndex={t.id === active ? 0 : -1}
            className={cx(s.tab, t.id === active && s.ativo)}
            onClick={() => {
              onChange(t.id);
            }}
          >
            {t.label}
            {t.count !== undefined && <span className={s.count}>{t.count}</span>}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

Tabs.Panel = function Panel({ id, active, children }: { id: string; active: string; children: ReactNode }) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className={s.panel}>
      {children}
    </div>
  );
};
