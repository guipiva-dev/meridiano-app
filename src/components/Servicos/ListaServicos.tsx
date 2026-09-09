import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { mensagemDeErro } from "@/api/http";
import { chavesServicos, type ServicoDto, servicosApi } from "@/api/servicos";
import { type ReservaDto, ROTULO_SERVICO } from "@/api/viagens";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, Skeleton, toast } from "@/components/feedback";
import { MenuAcoes } from "@/components/Menu/MenuAcoes";
import { formatarDataHora } from "@/lib/datas";
import { ServicoModal } from "./ServicoModal";
import s from "./Servicos.module.css";

/** "Aéreo · GRU→LIS · 18/04/2026 22:30 → 19/04/2026 12:05 · LA8084" */
function descrever(servico: ServicoDto): string {
  const partes = [ROTULO_SERVICO[servico.tipo], servico.titulo];
  if (servico.dataInicio) {
    partes.push(
      servico.dataFim
        ? `${formatarDataHora(servico.dataInicio)} → ${formatarDataHora(servico.dataFim)}`
        : formatarDataHora(servico.dataInicio),
    );
  }
  if (servico.localizadorCia) partes.push(servico.localizadorCia);
  return partes.join(" · ");
}

export function ListaServicos({ reserva, podeEditar }: { reserva: ReservaDto; podeEditar: boolean }) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<ServicoDto | undefined>();
  const [abertoModal, setAbertoModal] = useState(false);
  const [excluindo, setExcluindo] = useState<ServicoDto>();

  const chave = chavesServicos.daReserva(reserva.id);
  const q = useQuery({ queryKey: chave, queryFn: () => servicosApi.daReserva(reserva.id) });
  function invalidar() {
    void qc.invalidateQueries({ queryKey: chave });
  }

  const excluir = useMutation({
    mutationFn: (servico: ServicoDto) => servicosApi.excluir(servico.id),
    onSettled: (_dados, erro) => {
      setExcluindo(undefined);
      if (erro) toast.error(mensagemDeErro(erro));
      invalidar();
    },
  });

  const itens = q.data ?? [];
  return (
    <div className={s.lista}>
      {q.isPending && <Skeleton lines={2} />}
      {q.isError && <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>}
      {!q.isPending && !q.isError && itens.length === 0 && (
        <span className={s.vazio}>Nenhum serviço detalhado nesta reserva.</span>
      )}
      {itens.map((servico) => (
        <div key={servico.id} className={s.linha}>
          <span className={s.texto}>{descrever(servico)}</span>
          {podeEditar && (
            <span className={s.acoes}>
              <MenuAcoes
                label={`Mais ações de ${servico.titulo}`}
                itens={[
                  {
                    label: "Editar",
                    onClick: () => {
                      setEditando(servico);
                      setAbertoModal(true);
                    },
                  },
                  {
                    label: "Excluir",
                    tone: "danger",
                    onClick: () => {
                      setExcluindo(servico);
                    },
                  },
                ]}
              />
            </span>
          )}
        </div>
      ))}
      {podeEditar && (
        <div>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => {
              setEditando(undefined);
              setAbertoModal(true);
            }}
          >
            + Serviço
          </Button>
        </div>
      )}

      {abertoModal && (
        <ServicoModal
          open
          reservaId={reserva.id}
          servico={editando}
          onClose={() => {
            setAbertoModal(false);
          }}
          onSalvo={invalidar}
        />
      )}
      {excluindo && (
        <ConfirmModal
          open
          title={`Excluir "${excluindo.titulo}"?`}
          impact="O serviço sai desta reserva. Isso não pode ser desfeito."
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
