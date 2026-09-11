import { Coins, Eye, Pencil, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { EventoAuditoriaDto } from "@/api/auditoria";
import { formatarCarimboRelativo } from "@/lib/datas";
import s from "./Auditoria.module.css";

const TABELAS_DINHEIRO = new Set(["movimento_financeiro", "repasse", "fechamento_periodo"]);

function iconeDe(evento: EventoAuditoriaDto) {
  if (evento.acao === "ACESSO") return <Eye size={16} aria-hidden />;
  if (TABELAS_DINHEIRO.has(evento.tabela)) return <Coins size={16} aria-hidden />;
  if (/cancel/i.test(evento.titulo)) return <XCircle size={16} aria-hidden />;
  return <Pencil size={16} aria-hidden />;
}

export function LinhaEvento({ evento, onDetalhes }: { evento: EventoAuditoriaDto; onDetalhes: () => void }) {
  const temAlteracoes = Object.keys(evento.alteracoes).length > 0;
  const partes: ReactNode[] = [];
  if (evento.subtitulo) partes.push(evento.subtitulo);
  if (evento.motivo) partes.push(`motivo: "${evento.motivo}"`);
  if (evento.viagemId && evento.codigoViagem) {
    partes.push(
      <span key="viagem">
        viagem <Link to={`/viagens/${evento.viagemId}`}>{evento.codigoViagem}</Link>
      </span>,
    );
  }

  return (
    <li className={s.evento}>
      <span className={s.icone}>{iconeDe(evento)}</span>
      <div className={s.corpo}>
        <b className={s.titulo}>
          {evento.usuarioNome ?? "Sistema"} — {evento.titulo}
        </b>
        {partes.length > 0 && (
          <span className={s.meta}>
            {partes.map((parte, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {parte}
              </span>
            ))}
          </span>
        )}
        <span className={s.meta}>
          {formatarCarimboRelativo(evento.criadoEm, { horaSempre: true })}
          {temAlteracoes && (
            <>
              {" · "}
              <button type="button" className={s.link} onClick={onDetalhes}>
                Ver detalhes
              </button>
            </>
          )}
        </span>
      </div>
    </li>
  );
}
