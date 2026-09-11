import { useState } from "react";
import type { AgendaPendenciasDto } from "@/api/agenda";
import type { PendenciaDto } from "@/api/pendencias";
import { ConfirmModal, EmptyState } from "@/components/feedback";
import s from "@/components/Pendencias/Pendencias.module.css";
import { AdiarModal, fontePendencias, LinhaPendencia, usePendenciasAcoes } from "@/components/pendencias";
import { Section } from "@/components/shell";

interface PendenciasAgendaProps {
  pendencias: AgendaPendenciasDto;
  responsavelId: string | null;
  podeEditar: boolean;
  onEditar: (p: PendenciaDto) => void;
}

/** Um grupo (Atrasadas/Hoje/Esta semana) de `PendenciasAgenda`. */
function Grupo({
  titulo,
  itens,
  podeEditar,
  acoes,
  onAdiar,
  onExcluir,
  onEditar,
}: {
  titulo: string;
  itens: PendenciaDto[];
  podeEditar: boolean;
  acoes: ReturnType<typeof usePendenciasAcoes>;
  onAdiar: (p: PendenciaDto) => void;
  onExcluir: (p: PendenciaDto) => void;
  onEditar: (p: PendenciaDto) => void;
}) {
  if (itens.length === 0) return null;
  return (
    <Section title={`${titulo} ${itens.length}`}>
      <div className={s.lista}>
        {itens.map((p) => (
          <LinhaPendencia
            key={p.id}
            p={p}
            podeEditar={podeEditar}
            mostrarViagem
            onConcluir={() => {
              acoes.concluir.mutate(p);
            }}
            onAdiar={() => {
              onAdiar(p);
            }}
            onEditar={() => {
              onEditar(p);
            }}
            onExcluir={() => {
              onExcluir(p);
            }}
          />
        ))}
      </div>
    </Section>
  );
}

export function PendenciasAgenda({ pendencias, responsavelId, podeEditar, onEditar }: PendenciasAgendaProps) {
  const fonte = fontePendencias({ agenda: true, responsavelId });
  const acoes = usePendenciasAcoes(fonte);
  const [adiando, setAdiando] = useState<PendenciaDto>();
  const [excluindo, setExcluindo] = useState<PendenciaDto>();

  const vazio = pendencias.atrasadas.length === 0 && pendencias.hoje.length === 0 && pendencias.semana.length === 0;

  return (
    <div className={s.painel}>
      {vazio ? (
        <EmptyState title="Nada para hoje" description="Sem pendências atrasadas, de hoje ou desta semana." />
      ) : (
        <>
          <Grupo
            titulo="Atrasadas"
            itens={pendencias.atrasadas}
            podeEditar={podeEditar}
            acoes={acoes}
            onAdiar={setAdiando}
            onExcluir={setExcluindo}
            onEditar={onEditar}
          />
          <Grupo
            titulo="Hoje"
            itens={pendencias.hoje}
            podeEditar={podeEditar}
            acoes={acoes}
            onAdiar={setAdiando}
            onExcluir={setExcluindo}
            onEditar={onEditar}
          />
          <Grupo
            titulo="Esta semana"
            itens={pendencias.semana}
            podeEditar={podeEditar}
            acoes={acoes}
            onAdiar={setAdiando}
            onExcluir={setExcluindo}
            onEditar={onEditar}
          />
        </>
      )}

      {adiando && (
        <AdiarModal
          open
          pendencia={adiando}
          onClose={() => {
            setAdiando(undefined);
          }}
          onAdiada={acoes.invalidar}
        />
      )}
      {excluindo && (
        <ConfirmModal
          open
          title={`Excluir "${excluindo.titulo}"?`}
          impact="A pendência sai da Agenda. Isso não pode ser desfeito."
          confirmLabel="Excluir"
          tone="danger"
          loading={acoes.excluir.isPending}
          onConfirm={() => {
            acoes.excluir.mutate(excluindo, {
              onSettled: () => {
                setExcluindo(undefined);
              },
            });
          }}
          onCancel={() => {
            setExcluindo(undefined);
          }}
        />
      )}
    </div>
  );
}
