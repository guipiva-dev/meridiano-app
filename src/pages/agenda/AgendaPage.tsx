import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { agendaApi, chavesAgenda } from "@/api/agenda";
import { mensagemDeErro } from "@/api/http";
import type { PendenciaDto } from "@/api/pendencias";
import { useAuth } from "@/auth/useAuth";
import { Button, Select } from "@/components";
import { Alert } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { NovaPendenciaModal } from "@/components/pendencias";
import { Page, PageHeader, type Tab, Tabs } from "@/components/shell";
import s from "./Agenda.module.css";
import { CreditosTab } from "./CreditosTab";
import { DocumentosTab } from "./DocumentosTab";
import { EmbarquesTab } from "./EmbarquesTab";
import { PendenciasAgenda } from "./PendenciasAgenda";

/** yyyy-mm-dd → "Terça, 7 de abril" (Intl com weekday "long" dá "terça-feira"; protótipo congelado
 * usa a forma curta, então tiramos o sufixo "-feira" mantendo a capitalização). */
function formatarCabecalhoData(iso: string): string {
  const data = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  const texto = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .format(data)
    .replace("-feira", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function AgendaPage() {
  const { pode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [aba, setAba] = useState("pendencias");
  const [pendModal, setPendModal] = useState<{ pendencia?: PendenciaDto } | null>(null);

  const responsavelId = searchParams.get("responsavelId");

  const q = useQuery({
    queryKey: chavesAgenda.lista(responsavelId),
    queryFn: () => agendaApi.listar(responsavelId),
    placeholderData: keepPreviousData,
  });
  const dto = q.data;

  const subtitulo = dto
    ? `${formatarCabecalhoData(dto.cabecalho.hoje)} · ${dto.cabecalho.pendenciasHoje} pendências hoje · ${dto.cabecalho.atrasadas} atrasadas · ${dto.cabecalho.embarquesSemana} embarques esta semana`
    : undefined;

  const tabs: Tab[] = [
    { id: "pendencias", label: "Pendências", count: dto?.pendencias.total },
    {
      id: "embarques",
      label: "Embarques e retornos",
      count: dto ? dto.embarques.length + dto.retornos.length : undefined,
    },
    { id: "documentos", label: "Documentos vencendo", count: dto?.documentos.length },
    { id: "creditos", label: "Créditos vencendo", count: dto?.creditos.length },
  ];

  return (
    <Page>
      <PageHeader
        title="Agenda"
        subtitle={subtitulo}
        actions={
          <div className={s.acoes}>
            <Select
              aria-label="Responsável"
              value={responsavelId ?? ""}
              placeholder="Responsável: todos"
              options={(dto?.responsaveis ?? []).map((r) => ({ value: r.id, label: r.nome }))}
              onChange={(e) => {
                setSearchParams((prev) => {
                  const proximos = new URLSearchParams(prev);
                  if (e.target.value) proximos.set("responsavelId", e.target.value);
                  else proximos.delete("responsavelId");
                  return proximos;
                });
              }}
            />
            {pode("viagem.editar") && (
              <Button
                variant="primary"
                onClick={() => {
                  setPendModal({});
                }}
              >
                + Nova pendência
              </Button>
            )}
          </div>
        }
      />

      {q.isError && <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>}
      {q.isPending && <Skeleton lines={8} />}

      {dto && (
        <Tabs tabs={tabs} active={aba} onChange={setAba}>
          <Tabs.Panel id="pendencias" active={aba}>
            <PendenciasAgenda
              pendencias={dto.pendencias}
              responsavelId={responsavelId}
              podeEditar={pode("viagem.editar")}
              onEditar={(p) => {
                setPendModal({ pendencia: p });
              }}
            />
          </Tabs.Panel>
          <Tabs.Panel id="embarques" active={aba}>
            <EmbarquesTab embarques={dto.embarques} retornos={dto.retornos} />
          </Tabs.Panel>
          <Tabs.Panel id="documentos" active={aba}>
            <DocumentosTab documentos={dto.documentos} />
          </Tabs.Panel>
          <Tabs.Panel id="creditos" active={aba}>
            <CreditosTab creditos={dto.creditos} />
          </Tabs.Panel>
        </Tabs>
      )}

      {pendModal && (
        <NovaPendenciaModal
          open
          escopo={{ agenda: true, responsavelId }}
          vendedores={dto?.responsaveis ?? []}
          pendencia={pendModal.pendencia}
          onClose={() => {
            setPendModal(null);
          }}
          onSalva={() => {
            void qc.invalidateQueries({ queryKey: ["agenda"] });
          }}
        />
      )}
    </Page>
  );
}
