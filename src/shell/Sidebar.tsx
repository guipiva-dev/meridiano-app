import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router";
import { agendaApi, chavesAgenda } from "@/api/agenda";
import { useAuth } from "@/auth/useAuth";
import { Badge } from "@/components/display";
import { cx } from "@/lib/cx";
import { itensSidebar, temPermissao } from "./navegacao";
import s from "./Sidebar.module.css";

export const SIDEBAR_ID = "sidebar-principal";

export function Sidebar({ aberta = false, onFechar }: { aberta?: boolean; onFechar?: () => void }) {
  const { me, pode } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const visiveis = itensSidebar.filter((i) => temPermissao(pode, i.permission));
  const secoes = ["Operação", "Administração"] as const;

  // R4: um endpoint, três contagens; erro do endpoint não pode derrubar a sidebar (sem badge).
  const badgesQ = useQuery({
    queryKey: chavesAgenda.badges(),
    queryFn: agendaApi.badges,
    enabled: !!me && (pode("viagem.ver") || pode("viagem.ver_proprias")),
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
  });
  const badges = badgesQ.data;

  useEffect(() => {
    if (aberta) navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [aberta]);

  return (
    <nav id={SIDEBAR_ID} ref={navRef} className={cx(s.side, aberta && s.aberta)} aria-label="Principal">
      <div className={s.brand}>Meridiano</div>
      {secoes.map((sec) => {
        const itens = visiveis.filter((i) => i.section === sec);
        if (!itens.length) return null;
        return (
          <div key={sec} className={s.secao}>
            <div className={s.secaoTitulo}>{sec}</div>
            {itens.map(({ label, icon: Icon, path, badge }) => {
              const n = badge ? (badges?.[badge] ?? null) : null;
              const rotulo = n && n > 0 ? `${label} · ${n} pendências` : label;
              return (
                <NavLink
                  key={path}
                  to={path}
                  title={label}
                  aria-label={rotulo}
                  onClick={onFechar}
                  className={({ isActive }) => cx(s.item, isActive && s.ativo)}
                >
                  <Icon size={18} aria-hidden />
                  <span className={s.label}>{label}</span>
                  {!!n && n > 0 && (
                    <span aria-hidden>
                      <Badge tone="warning">{n}</Badge>
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
