import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useAtalho } from "@/lib/useAtalho";
import s from "./AppShell.module.css";
import { GlobalHeader } from "./GlobalHeader";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const [rotaAnterior, setRotaAnterior] = useState(loc.pathname);
  if (loc.pathname !== rotaAnterior) {
    setRotaAnterior(loc.pathname);
    setMenu(false);
  }
  const fechar = () => {
    setMenu(false);
  };
  useAtalho("escape", fechar, menu);
  return (
    <div className={s.shell}>
      {menu && <button type="button" className={s.backdrop} aria-label="Fechar menu" onClick={fechar} />}
      <Sidebar aberta={menu} onFechar={fechar} />
      <div className={s.main}>
        <GlobalHeader
          menuAberto={menu}
          onMenu={() => {
            setMenu((m) => !m);
          }}
        />
        <Outlet />
      </div>
    </div>
  );
}
