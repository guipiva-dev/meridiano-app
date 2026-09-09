import { Bell, CircleHelp, LogOut, Menu, Plus, Search } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { Button, IconButton, Input } from "@/components";
import { useAtalho } from "@/lib/useAtalho";
import s from "./GlobalHeader.module.css";
import { SIDEBAR_ID } from "./Sidebar";

export function GlobalHeader({ onMenu, menuAberto }: { onMenu: () => void; menuAberto: boolean }) {
  const { me, pode, sair } = useAuth();
  const nav = useNavigate();
  const busca = useRef<HTMLInputElement>(null);
  useAtalho("ctrl+k", () => busca.current?.focus());
  return (
    <header className={s.top}>
      <IconButton
        label="Menu"
        icon={<Menu size={20} />}
        onClick={onMenu}
        className={s.menu}
        aria-expanded={menuAberto}
        aria-controls={SIDEBAR_ID}
      />
      <div className={s.busca}>
        <Search size={16} aria-hidden className={s.buscaIcone} />
        <Input ref={busca} aria-label="Buscar" placeholder="Buscar cliente, viagem, localizador…" />
        <kbd className={s.kbd}>Ctrl K</kbd>
      </div>
      {pode("viagem.criar") && (
        <Button variant="secondary" icon={<Plus size={16} />} onClick={() => void nav("/viagens/nova")}>
          Nova viagem
        </Button>
      )}
      <IconButton label="Notificações" icon={<Bell size={20} />} />
      <IconButton label="Ajuda" icon={<CircleHelp size={20} />} />
      <div className={s.user}>
        <span className={s.nome}>{me?.nome}</span>
        <IconButton
          label="Sair"
          icon={<LogOut size={20} />}
          onClick={() => {
            void sair().then(() => nav("/login"));
          }}
        />
      </div>
    </header>
  );
}
