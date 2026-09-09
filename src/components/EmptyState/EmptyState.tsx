import type { ReactNode } from "react";
import s from "./EmptyState.module.css";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      {icon && <div className={s.icon}>{icon}</div>}
      <h3 className={s.title}>{title}</h3>
      <p className={s.desc}>{description}</p>
      {action}
    </div>
  );
}
