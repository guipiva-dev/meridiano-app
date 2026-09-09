import type { ReactNode } from "react";
import s from "./AuthLayout.module.css";

export function AuthLayout({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <div className={s.auth}>
      <aside className={s.art}>
        <div className={s.brand}>Meridiano</div>
        <p className={s.lead}>{subtitle}</p>
        <p className={s.copy}>© 2026 Build Solutions</p>
      </aside>
      <main className={s.panel}>{children}</main>
    </div>
  );
}
