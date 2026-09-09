import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { instalarAtalhos } from "@/lib/atalhos";
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
  useEffect(instalarAtalhos, []);
  return (
    <div className={s.shell}>
      <Sidebar
        aberta={menu}
        onFechar={() => {
          setMenu(false);
        }}
      />
      <div className={s.main}>
        <GlobalHeader
          onMenu={() => {
            setMenu((m) => !m);
          }}
        />
        <Outlet />
      </div>
    </div>
  );
}
