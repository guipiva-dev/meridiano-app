import type { ReactNode } from "react";
import s from "./Page.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  status?: ReactNode;
  dirty?: boolean;
  /** Momento do último save bem-sucedido; some assim que houver nova edição (`dirty`). */
  salvoEm?: Date | null;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, status, dirty, salvoEm, actions }: PageHeaderProps) {
  return (
    <header className={s.head}>
      <div>
        <h1 className={s.titulo}>
          {title}
          {meta}
          {status}
        </h1>
        {subtitle && <p className={s.subtitulo}>{subtitle}</p>}
      </div>
      <div className={s.acoes}>
        {dirty ? (
          <span className={s.dirty} aria-live="polite">
            ● Alterações não salvas
          </span>
        ) : (
          salvoEm && (
            <span className={s.salvo} aria-live="polite">
              ✓ Salvo às {salvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )
        )}
        {actions}
      </div>
    </header>
  );
}
