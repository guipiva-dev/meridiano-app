import { NavLink } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { cx } from "@/lib/cx";
import { itensSidebar, temPermissao } from "./navegacao";
import s from "./Sidebar.module.css";

export function Sidebar({ aberta = false, onFechar }: { aberta?: boolean; onFechar?: () => void }) {
  const { pode } = useAuth();
  const visiveis = itensSidebar.filter((i) => temPermissao(pode, i.permission));
  const secoes = ["Operação", "Administração"] as const;
  return (
    <nav className={cx(s.side, aberta && s.aberta)} aria-label="Principal">
      <div className={s.brand}>Meridiano</div>
      {secoes.map((sec) => {
        const itens = visiveis.filter((i) => i.section === sec);
        if (!itens.length) return null;
        return (
          <div key={sec} className={s.secao}>
            <div className={s.secaoTitulo}>{sec}</div>
            {itens.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onFechar}
                className={({ isActive }) => cx(s.item, isActive && s.ativo)}
              >
                <Icon size={18} aria-hidden />
                <span className={s.label}>{label}</span>
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
