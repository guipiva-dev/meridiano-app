import type { PendenciaDto } from "@/api/pendencias";
import { Button } from "@/components";
import { StatusBadge } from "@/components/display";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { cx } from "@/lib/cx";
import { formatarData } from "@/lib/datas";
import s from "./Pendencias.module.css";

interface LinhaPendenciaProps {
  p: PendenciaDto;
  onConcluir: () => void;
  onAdiar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  podeEditar: boolean;
}

export function LinhaPendencia({ p, onConcluir, onAdiar, onEditar, onExcluir, podeEditar }: LinhaPendenciaProps) {
  const aberta = p.status === "aberta";
  const titulo = p.clienteNome ? `${p.titulo} — ${p.clienteNome}` : p.titulo;
  // R10: automática só aceita concluir/adiar; editar/excluir dariam 422 pendencia_automatica.
  const itens: ItemMenu[] = [{ label: "Adiar", onClick: onAdiar }];
  if (p.origem === "manual") {
    itens.push({ label: "Editar", onClick: onEditar }, { label: "Excluir", onClick: onExcluir, tone: "danger" });
  }

  return (
    <div className={s.linha}>
      <input
        type="checkbox"
        className={s.check}
        aria-label={`Concluir ${p.titulo}`}
        checked={!aberta}
        disabled={!podeEditar || !aberta}
        onChange={onConcluir}
      />
      <div className={s.texto}>
        <b className={cx(s.titulo, !aberta && s.concluido)}>{titulo}</b>
        <span className={s.meta}>
          {formatarData(p.dataPrevista)} · {p.origem === "automatica" ? "automática" : "manual"}
          {p.responsavelNome && <span className={s.resp}>{p.responsavelNome}</span>}
        </span>
      </div>
      {p.prioridade === "urgente" && aberta && <StatusBadge entidade="prioridade" valor="urgente" />}
      {p.atrasada && aberta && <StatusBadge entidade="pendencia" valor="atrasada" />}
      {podeEditar && aberta && (
        <div className={s.acoes}>
          <Button variant="secondary" size="sm" onClick={onConcluir}>
            ✓ Concluir
          </Button>
          <MenuAcoes label={`Mais ações de ${p.titulo}`} itens={itens} />
        </div>
      )}
    </div>
  );
}
