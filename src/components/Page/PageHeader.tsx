import type { ReactNode } from "react";
import s from "./Page.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  status?: ReactNode;
  dirty?: boolean;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, status, dirty, actions }: PageHeaderProps) {
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
        {dirty && (
          <span className={s.dirty} aria-live="polite">
            ● Alterações não salvas
          </span>
        )}
        {actions}
      </div>
    </header>
  );
}
