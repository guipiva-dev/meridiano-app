import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { mensagemDeErro } from "@/api/http";
import { chavesPendencias, type PendenciaDto, pendenciasApi } from "@/api/pendencias";
import type { PassageiroDto, VendedorDto } from "@/api/viagens";
import { Button, Checkbox } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, EmptyState, Skeleton, toast } from "@/components/feedback";
import { AdiarModal } from "./AdiarModal";
import { chaveDasPendencias } from "./chave";
import { LinhaPendencia } from "./LinhaPendencia";
import { NovaPendenciaModal } from "./NovaPendenciaModal";
import s from "./Pendencias.module.css";

interface ListaPendenciasProps {
  viagemId: string;
  passageiros: PassageiroDto[];
  vendedores: VendedorDto[];
  podeEditar: boolean;
}

const AJUDA = "Toda pendência tem data. Aparece aqui, na Agenda e na aba Pendências de cada passageiro.";

export function ListaPendencias({ viagemId, passageiros, vendedores, podeEditar }: ListaPendenciasProps) {
  const qc = useQueryClient();
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);
  const [editando, setEditando] = useState<PendenciaDto | undefined>();
  const [criando, setCriando] = useState(false);
  const [adiando, setAdiando] = useState<PendenciaDto>();
  const [excluindo, setExcluindo] = useState<PendenciaDto>();

  const chave = chavesPendencias.daViagem(viagemId, mostrarConcluidas);
  const q = useQuery({
    queryKey: chave,
    queryFn: () => pendenciasApi.daViagem(viagemId, mostrarConcluidas),
  });

  function invalidar() {
    void qc.invalidateQueries({ queryKey: chaveDasPendencias(viagemId) });
  }
  function falhou(e: unknown) {
    toast.error(mensagemDeErro(e));
    invalidar();
  }

  const concluir = useMutation({
    mutationFn: (p: PendenciaDto) => pendenciasApi.concluir(p.id, p.versao),
    onSuccess: invalidar,
    onError: falhou,
  });
  const excluir = useMutation({
    mutationFn: (p: PendenciaDto) => pendenciasApi.cancelar(p.id),
    onSuccess: () => {
      setExcluindo(undefined);
      invalidar();
    },
    onError: (e) => {
      setExcluindo(undefined);
      falhou(e);
    },
  });

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
          description="Nada pendente nesta viagem. Crie uma quando precisar lembrar de algo com data."
        />
      )}
      {itens.length > 0 && (
        <div className={s.lista}>
          {itens.map((p) => (
            <LinhaPendencia
              key={p.id}
              p={p}
              podeEditar={podeEditar}
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
          viagemId={viagemId}
          passageiros={passageiros}
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
            excluir.mutate(excluindo);
          }}
          onCancel={() => {
            setExcluindo(undefined);
          }}
        />
      )}
    </div>
  );
}
