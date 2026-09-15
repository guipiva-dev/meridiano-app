import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { anexosApi, chavesAnexos } from "@/api/anexos";
import { mensagemDeErro } from "@/api/errors";
import { chavesPendencias, pendenciasApi } from "@/api/pendencias";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { ListaPendencias } from "@/components/pendencias";
import { Page, type Tab, Tabs } from "@/components/shell";
import { CabecalhoViagem } from "./CabecalhoViagem";
import { DocumentosTab } from "./DocumentosTab";
import { FinanceiroTab } from "./FinanceiroTab";
import { ModaisViagem } from "./modais";
import { PainelViagem } from "./PainelViagem";
import { ReservasTab } from "./ReservasTab";
import { TimelineTab } from "./TimelineTab";
import { useViagem } from "./useViagem";
import s from "./Viagem.module.css";

export function ViagemPage() {
  const { id = "" } = useParams();
  const v = useViagem(id);
  const pendenciasQ = useQuery({
    queryKey: chavesPendencias.daViagem(id, false),
    queryFn: () => pendenciasApi.daViagem(id, false),
  });
  const anexosQ = useQuery({ queryKey: chavesAnexos.daViagem(id), queryFn: () => anexosApi.daViagem(id) });

  const viagem = v.viagem;

  // Cabeçalho fixo: o painel lateral cola logo abaixo dele (`--topo-h`), como na Nova viagem.
  const topoRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const topo = topoRef.current;
    const area = areaRef.current;
    if (!topo || !area || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      area.style.setProperty("--topo-h", `${topo.offsetHeight}px`);
    });
    ro.observe(topo);
    return () => {
      ro.disconnect();
    };
  }, [viagem?.id]);

  if (v.carregando) {
    return (
      <Page>
        <div className={s.area}>
          <div className={s.principal}>
            <Skeleton lines={2} />
            <Skeleton lines={6} />
          </div>
          <Skeleton lines={8} />
        </div>
      </Page>
    );
  }
  if (v.erro || !viagem) {
    return (
      <Page>
        <Alert
          tone="danger"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void v.recarregar();
              }}
            >
              Tentar de novo
            </Button>
          }
        >
          {mensagemDeErro(v.erro)}
        </Alert>
      </Page>
    );
  }

  const podeEditar = v.pode("viagem.editar");
  const abertas = (pendenciasQ.data ?? []).filter((p) => p.status === "aberta").length;
  const reservasAtivas = viagem.reservas.filter((r) => r.status !== "cancelada").length;
  const reservasTotal = viagem.reservas.length;
  const tabs: Tab[] = [
    {
      id: "reservas",
      label: "Reservas",
      count: reservasTotal > reservasAtivas ? `Ativas ${reservasAtivas} · Total ${reservasTotal}` : reservasAtivas,
    },
    ...(v.verValores ? [{ id: "financeiro", label: "Financeiro" }] : []),
    { id: "pendencias", label: "Pendências", count: abertas },
    { id: "documentos", label: "Documentos", count: anexosQ.data?.length },
    ...(v.pode("auditoria.ver") ? [{ id: "timeline", label: "Timeline" }] : []),
  ];
  const tab = tabs.some((t) => t.id === v.tab) ? v.tab : "reservas";

  return (
    <Page titulo={`${viagem.codigo} · ${viagem.destino}`}>
      <div ref={topoRef} className={s.topo}>
        <CabecalhoViagem
          viagem={viagem}
          pode={v.pode}
          onTransferir={() => {
            v.abrir({ tipo: "transferir" });
          }}
          onCancelar={() => {
            v.abrir({ tipo: "cancelarViagem" });
          }}
        />
      </div>
      <div ref={areaRef} className={s.area}>
        <div className={s.principal}>
          <Tabs tabs={tabs} active={tab} onChange={v.setTab}>
            <Tabs.Panel id="reservas" active={tab}>
              <ReservasTab
                key={viagem.id}
                viagem={viagem}
                creditos={v.creditos}
                verValores={v.verValores}
                podeEditar={podeEditar}
                reservaAberta={v.reservaAberta}
                abrir={v.abrir}
              />
            </Tabs.Panel>
            <Tabs.Panel id="financeiro" active={tab}>
              <FinanceiroTab viagem={viagem} />
            </Tabs.Panel>
            <Tabs.Panel id="pendencias" active={tab}>
              <ListaPendencias
                viagemId={viagem.id}
                passageiros={viagem.passageiros}
                vendedores={v.vendedores}
                podeEditar={podeEditar && !viagem.cancelada}
              />
            </Tabs.Panel>
            <Tabs.Panel id="documentos" active={tab}>
              <DocumentosTab viagem={viagem} podeEnviar={v.pode("anexo.enviar")} />
            </Tabs.Panel>
            <Tabs.Panel id="timeline" active={tab}>
              <TimelineTab viagemId={viagem.id} />
            </Tabs.Panel>
          </Tabs>
        </div>
        <PainelViagem
          viagem={viagem}
          verValores={v.verValores}
          pendencias={pendenciasQ.data ?? []}
          onVerPendencias={() => {
            v.setTab("pendencias");
          }}
        />
      </div>

      <ModaisViagem
        modal={v.modal}
        viagem={viagem}
        vendedores={v.vendedores}
        creditos={v.creditos}
        aplicar={v.aplicar}
        recarregar={() => {
          void v.recarregar();
        }}
        fechar={v.fechar}
      />
    </Page>
  );
}
