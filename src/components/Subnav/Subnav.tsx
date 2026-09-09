import { NavLink, useLocation } from "react-router";
import { cx } from "@/lib/cx";
import s from "./Subnav.module.css";

export interface ItemSubnav {
  label: string;
  path: string;
}

/** Item ativo quando o pathname bate exato, ou começa com `path + "/"` e nenhum outro item bate mais especificamente. */
function ehAtivo(item: ItemSubnav, items: ItemSubnav[], pathname: string): boolean {
  const candidatos = items.filter((i) => pathname === i.path || pathname.startsWith(`${i.path}/`));
  if (candidatos.length === 0) return false;
  const maisEspecifico = candidatos.reduce((a, b) => (b.path.length > a.path.length ? b : a));
  return maisEspecifico.path === item.path;
}

export function Subnav({ items }: { items: ItemSubnav[] }) {
  const { pathname } = useLocation();
  return (
    <nav className={s.subnav} aria-label="Seções do módulo">
      {items.map((i) => (
        <NavLink key={i.path} to={i.path} className={cx(s.item, ehAtivo(i, items, pathname) && s.ativo)}>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
