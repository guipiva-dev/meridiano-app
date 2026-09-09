import { X } from "lucide-react";
import { IconButton } from "@/components";
import { cx } from "@/lib/cx";
import s from "./Toast.module.css";
import { remover, useToasts } from "./toast";

export function ToastHost() {
  const itens = useToasts();
  return (
    <div className={s.host} aria-live="polite">
      {itens.map((t) => (
        <div key={t.id} role="status" className={cx(s.toast, s[t.tipo])}>
          <span>{t.texto}</span>
          {t.tipo === "undo" && t.desfazer && (
            <button
              type="button"
              className={s.link}
              onClick={() => {
                t.desfazer?.();
                remover(t.id);
              }}
            >
              Desfazer
            </button>
          )}
          <IconButton
            label="Fechar"
            icon={<X size={16} />}
            onClick={() => {
              remover(t.id);
            }}
            className={s.close}
          />
        </div>
      ))}
    </div>
  );
}
