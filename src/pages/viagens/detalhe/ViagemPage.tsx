import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { anexosApi, chavesAnexos } from "@/api/anexos";
import { mensagemDeErro } from "@/api/errors";
import { chavesPendencias, pendenciasApi } from "@/api/pendencias";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { ListaPendencias } from "@/components/pendencias";
import { Page, Subnav, type Tab, Tabs } from "@/components/shell";
import { subnavs } from "@/shell/navegacao";
import { CabecalhoViagem } from "./CabecalhoViagem";
import { DocumentosTab } from "./DocumentosTab";
import { FinanceiroTab } from "./FinanceiroTab";
import { ModaisViagem } from "./modais";
import { ReservasTab } from "./ReservasTab";
import { ResumoTab } from "./ResumoTab";
import { TimelineTab } from "./TimelineTab";
import { useViagem } from "./useViagem";

export function ViagemPage() {
  const { id = "" } = useParams();
  const v = useViagem(id);
  const pendenciasQ = useQuery({
    queryKey: chavesPendencias.daViagem(id, false),
    queryFn: () => pendenciasApi.daViagem(id, false),
  });
  const anexosQ = useQuery({ queryKey: chavesAnexos.daViagem(id), queryFn: () => anexosApi.daViagem(id) });

  const viagem = v.viagem;
  if (v.carregando) {
    return (
      <Page>
        <Skeleton lines={8} />
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
  const tabs: Tab[] = [
    { id: "resumo", label: "Resumo" },
    { id: "reservas", label: "Reservas", count: viagem.reservas.filter((r) => r.status !== "cancelada").length },
    ...(v.verValores ? [{ id: "financeiro", label: "Financeiro" }] : []),
    { id: "pendencias", label: "Pendências", count: abertas },
    { id: "documentos", label: "Documentos", count: anexosQ.data?.length },
    ...(v.pode("auditoria.ver") ? [{ id: "timeline", label: "Timeline" }] : []),
  ];
  const tab = tabs.some((t) => t.id === v.tab) ? v.tab : "resumo";

  return (
    <Page>
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
      <Subnav items={subnavs["/viagens"] ?? []} />

      <Tabs tabs={tabs} active={tab} onChange={v.setTab}>
        <Tabs.Panel id="resumo" active={tab}>
          <ResumoTab
            viagem={viagem}
            verValores={v.verValores}
            pendencias={pendenciasQ.data ?? []}
            onAbrirReserva={v.abrirReserva}
            onVerPendencias={() => {
              v.setTab("pendencias");
            }}
          />
        </Tabs.Panel>
        <Tabs.Panel id="reservas" active={tab}>
          <ReservasTab
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
