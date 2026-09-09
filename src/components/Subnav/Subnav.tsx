import { NavLink } from "react-router";
import { cx } from "@/lib/cx";
import s from "./Subnav.module.css";

export function Subnav({ items }: { items: { label: string; path: string }[] }) {
  return (
    <nav className={s.subnav} aria-label="Seções do módulo">
      {items.map((i) => (
        <NavLink key={i.path} to={i.path} end className={({ isActive }) => cx(s.item, isActive && s.ativo)}>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
