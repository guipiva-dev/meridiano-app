import type { ReactNode } from "react";
import s from "./Page.module.css";

export function Section({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={s.section}>
      {title && <h2 className={s.sectionTitulo}>{title}</h2>}
      {description && <p className={s.sectionDesc}>{description}</p>}
      {children}
    </section>
  );
}
