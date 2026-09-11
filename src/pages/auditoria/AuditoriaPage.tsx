import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import type { EventoAuditoriaDto, FiltroAuditoria } from "@/api/auditoria";
import { auditoriaApi, chavesAuditoria, urlCsv } from "@/api/auditoria";
import { mensagemDeErro } from "@/api/errors";
import { Button } from "@/components";
import { DetalhesEventoModal, LinhaEvento } from "@/components/auditoria";
import { Alert } from "@/components/display";
import { EmptyState, Skeleton } from "@/components/feedback";
import { Page, PageHeader } from "@/components/shell";
import { baixar } from "@/lib/download";
import s from "./Auditoria.module.css";
import { FiltrosAuditoria } from "./FiltrosAuditoria";

export function AuditoriaPage() {
  // Filtros vivem na URL (como nas demais telas): compartilháveis e sobrevivem ao recarregar.
  const [params, setParams] = useSearchParams();
  const usuarioId = params.get("usuario") ?? undefined;
  const oque = (params.get("oque") as FiltroAuditoria["oque"]) ?? undefined;
  const de = params.get("de") ?? undefined;
  const ate = params.get("ate") ?? undefined;
  const [detalhe, setDetalhe] = useState<EventoAuditoriaDto | null>(null);

  const filtroBase: FiltroAuditoria = { usuarioId, oque, de, ate };

  function definirFiltro(chave: string) {
    return (valor: string | undefined) => {
      setParams(
        (prev) => {
          const proximos = new URLSearchParams(prev);
          if (valor) proximos.set(chave, valor);
          else proximos.delete(chave);
          return proximos;
        },
        { replace: true },
      );
    };
  }

  const q = useInfiniteQuery({
    queryKey: chavesAuditoria.lista(filtroBase),
    queryFn: ({ pageParam }) => auditoriaApi.listar({ ...filtroBase, ...pageParam }),
    // Cursor composto (criado_em, id): eventos da mesma transação compartilham criado_em.
    initialPageParam: null as { antesDe: string; antesDeId: number } | null,
    getNextPageParam: (ultimaPagina) =>
      ultimaPagina.proximoAntesDe != null && ultimaPagina.proximoAntesDeId != null
        ? { antesDe: ultimaPagina.proximoAntesDe, antesDeId: ultimaPagina.proximoAntesDeId }
        : null,
    placeholderData: keepPreviousData,
  });

  const itens = q.data?.pages.flatMap((p) => p.itens) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  const usuarios = q.data?.pages[0]?.usuarios ?? [];
  const proximoAntesDe = q.data?.pages[q.data.pages.length - 1]?.proximoAntesDe ?? null;

  return (
    <Page>
      <PageHeader
        title="Auditoria"
        subtitle="Toda alteração em viagem, reserva, recebimento, repasse, usuário e cliente · retenção 24 meses"
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              baixar(urlCsv(filtroBase), "auditoria.csv");
            }}
          >
            Exportar CSV
          </Button>
        }
      />

      <FiltrosAuditoria
        usuarios={usuarios}
        usuarioId={usuarioId}
        oque={oque}
        de={de}
        ate={ate}
        onUsuarioId={definirFiltro("usuario")}
        onOque={definirFiltro("oque")}
        onDe={definirFiltro("de")}
        onAte={definirFiltro("ate")}
      />

      {q.isError ? (
        <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>
      ) : q.isLoading ? (
        <Skeleton lines={6} />
      ) : itens.length === 0 ? (
        <EmptyState title="Nenhum evento no período" description="Ajuste os filtros para ver outros eventos." />
      ) : (
        <>
          <ol className={s.lista}>
            {itens.map((evento) => (
              <LinhaEvento
                key={`${evento.tabela}:${evento.id}`}
                evento={evento}
                onDetalhes={() => {
                  setDetalhe(evento);
                }}
              />
            ))}
          </ol>
          <div className={s.rodape}>
            <span>{`1–${itens.length} de ${total}`}</span>
            {proximoAntesDe && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void q.fetchNextPage();
                }}
              >
                Mais antigas →
              </Button>
            )}
          </div>
        </>
      )}

      {detalhe && (
        <DetalhesEventoModal
          evento={detalhe}
          onClose={() => {
            setDetalhe(null);
          }}
        />
      )}
    </Page>
  );
}
