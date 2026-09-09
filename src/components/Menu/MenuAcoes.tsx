import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components";
import { useAtalho } from "@/lib/useAtalho";
import s from "./Menu.module.css";

export interface ItemMenu {
  label: string;
  onClick: () => void;
  tone?: "danger";
}

/** Popover "⋯" do contrato §4.4 (uma ação visível + menu). Fecha no Esc e no clique fora. */
export function MenuAcoes({ label, itens }: { label: string; itens: ItemMenu[] }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useAtalho(
    "escape",
    () => {
      setAberto(false);
    },
    aberto,
  );

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => {
      document.removeEventListener("mousedown", fora);
    };
  }, [aberto]);

  if (itens.length === 0) return null;
  return (
    <div ref={ref} className={s.wrap}>
      <IconButton
        label={label}
        icon={<MoreHorizontal size={20} />}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => {
          setAberto((a) => !a);
        }}
      />
      {aberto && (
        <ul role="menu" className={s.menu}>
          {itens.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                role="menuitem"
                className={item.tone === "danger" ? `${s.item} ${s.danger}` : s.item}
                onClick={() => {
                  setAberto(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
