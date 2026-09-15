import type { ReactNode } from "react";
import s from "./Viagem.module.css";

export const TOOLTIP_RECEBIDA = "Comissões, RAV e taxas que já entraram no caixa (movimentos)";

export function Bloco({ titulo, meta, children }: { titulo: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.bloco}>
      <header className={s.blocoTopo}>
        <h2 className={s.blocoTitulo}>{titulo}</h2>
        {meta && <span className={s.blocoMeta}>{meta}</span>}
      </header>
      {children}
    </section>
  );
}
