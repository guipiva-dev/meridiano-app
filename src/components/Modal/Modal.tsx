import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@/components";
import { instalarAtalhos } from "@/lib/atalhos";
import { cx } from "@/lib/cx";
import { useAtalho } from "@/lib/useAtalho";
import s from "./Modal.module.css";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  size?: "md" | "lg";
  footer?: ReactNode;
  children: ReactNode;
}

const FOCAVEIS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, title, onClose, size = "md", footer, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(instalarAtalhos, []);
  useAtalho("escape", open ? onClose : () => undefined);

  useEffect(() => {
    if (!open) return;
    const anterior = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focaveis = el?.querySelectorAll<HTMLElement>(FOCAVEIS);
    (focaveis?.[0] ?? el)?.focus();
    function prender(e: KeyboardEvent) {
      if (e.key !== "Tab" || !focaveis?.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (!primeiro || !ultimo) return;
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    el?.addEventListener("keydown", prender);
    return () => {
      el?.removeEventListener("keydown", prender);
      anterior?.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- fecha ao clicar fora; teclado já fecha via Esc (useAtalho)
    <div
      className={s.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cx(s.modal, size === "lg" && s.lg)}
      >
        <header className={s.header}>
          <h2 id="modal-title" className={s.title}>
            {title}
          </h2>
          <IconButton label="Fechar" icon={<X size={20} />} onClick={onClose} />
        </header>
        <div className={s.body}>{children}</div>
        {footer && <footer className={s.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
