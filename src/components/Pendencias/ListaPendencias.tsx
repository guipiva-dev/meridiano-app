import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { mensagemDeErro } from "@/api/http";
import type { PendenciaDto } from "@/api/pendencias";
import type { VendedorDto } from "@/api/viagens";
import { Button, Checkbox } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, EmptyState, Skeleton } from "@/components/feedback";
import { AdiarModal } from "./AdiarModal";
import { type EscopoPendencias, fontePendencias } from "./escopo";
import { LinhaPendencia } from "./LinhaPendencia";
import { NovaPendenciaModal } from "./NovaPendenciaModal";
import s from "./Pendencias.module.css";
import { usePendenciasAcoes } from "./usePendenciasAcoes";

type ListaPendenciasProps = EscopoPendencias & {
  vendedores: VendedorDto[];
  podeEditar: boolean;
};

const AJUDA = "Toda pendência tem data. Aparece aqui, na Agenda e na aba Pendências de cada passageiro.";

export function ListaPendencias(props: ListaPendenciasProps) {
  const { vendedores, podeEditar } = props;
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);
  const [editando, setEditando] = useState<PendenciaDto | undefined>();
  const [criando, setCriando] = useState(false);
  const [adiando, setAdiando] = useState<PendenciaDto>();
  const [excluindo, setExcluindo] = useState<PendenciaDto>();

  const fonte = fontePendencias(props);
  const q = useQuery({
    queryKey: fonte.chave(mostrarConcluidas),
    queryFn: () => fonte.buscar(mostrarConcluidas),
  });

  const { concluir, excluir, invalidar } = usePendenciasAcoes(fonte);

  const itens = q.data ?? [];
  return (
    <div className={s.painel}>
      <div className={s.topo}>
        {podeEditar && (
          <Button
            variant="primary"
            onClick={() => {
              setEditando(undefined);
              setCriando(true);
            }}
          >
            + Nova pendência
          </Button>
        )}
        <span className={s.ajuda}>{AJUDA}</span>
        <span className={s.mostrarConcluidas}>
          <Checkbox
            label="Mostrar concluídas"
            checked={mostrarConcluidas}
            onChange={(e) => {
              setMostrarConcluidas(e.target.checked);
            }}
          />
        </span>
      </div>

      {q.isPending && <Skeleton lines={3} />}
      {q.isError && <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>}
      {!q.isPending && !q.isError && itens.length === 0 && (
        <EmptyState
          title="Nenhuma pendência"
          description={
            fonte.pessoa
              ? "Nada pendente para esta pessoa. Crie uma quando precisar lembrar de algo com data."
              : "Nada pendente nesta viagem. Crie uma quando precisar lembrar de algo com data."
          }
        />
      )}
      {itens.length > 0 && (
        <div className={s.lista}>
          {itens.map((p) => (
            <LinhaPendencia
              key={p.id}
              p={p}
              podeEditar={podeEditar}
              mostrarViagem={fonte.pessoa}
              onConcluir={() => {
                concluir.mutate(p);
              }}
              onAdiar={() => {
                setAdiando(p);
              }}
              onEditar={() => {
                setEditando(p);
                setCriando(true);
              }}
              onExcluir={() => {
                setExcluindo(p);
              }}
            />
          ))}
        </div>
      )}

      {criando && (
        <NovaPendenciaModal
          open
          escopo={props}
          vendedores={vendedores}
          pendencia={editando}
          onClose={() => {
            setCriando(false);
          }}
          onSalva={invalidar}
        />
      )}
      {adiando && (
        <AdiarModal
          open
          pendencia={adiando}
          onClose={() => {
            setAdiando(undefined);
          }}
          onAdiada={invalidar}
        />
      )}
      {excluindo && (
        <ConfirmModal
          open
          title={`Excluir "${excluindo.titulo}"?`}
          impact="A pendência sai da viagem e da Agenda. Isso não pode ser desfeito."
          confirmLabel="Excluir"
          tone="danger"
          loading={excluir.isPending}
          onConfirm={() => {
            excluir.mutate(excluindo, {
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
