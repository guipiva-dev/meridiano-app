import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { chavesFornecedores, type FornecedorDetalheDto } from "@/api/fornecedores";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components";
import { Alert, Badge } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { Page, PageHeader, type Tab, Tabs } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { useAtalho } from "@/lib/useAtalho";
import { DadosFornecedorForm } from "./DadosFornecedorForm";
import { RegrasTab } from "./RegrasTab";
import { ReservasFornecedorTab } from "./ReservasFornecedorTab";
import { useFornecedor } from "./useFornecedor";

function subtitulo(d: FornecedorDetalheDto): string {
  const partes = [apresentacaoStatus("fornecedor_tipo", d.tipo).texto, `${d.resumo.reservas} reservas`];
  if (d.percentualComissaoPadrao !== null) partes.push(`comissão padrão ${d.percentualComissaoPadrao} %`);
  return partes.join(" · ");
}

export function FornecedorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { pode } = useAuth();
  const f = useFornecedor(id);
  const dto = f.dto;
  const podeEditar = pode("fornecedor.editar");
  const dirty = f.salvamento.estado === "dirty" || f.salvamento.estado === "error";

  useAtalho("ctrl+s", () => {
    void f.salvar();
  });

  if (f.carregando) {
    return (
      <Page>
        <Skeleton lines={6} />
      </Page>
    );
  }

  const tabs: Tab[] = [
    { id: "dados", label: "Dados" },
    ...(id && dto
      ? [
          { id: "financeiro", label: "Financeiro" },
          { id: "reservas", label: "Reservas", count: dto.resumo.reservas },
        ]
      : []),
  ];
  const tab = tabs.some((t) => t.id === f.tab) ? f.tab : "dados";

  return (
    <Page dirty={dirty} titulo={dto?.nome ?? "Novo fornecedor"} onSalvarESair={f.salvar}>
      <PageHeader
        title={dto?.nome ?? "Novo fornecedor"}
        subtitle={dto ? subtitulo(dto) : undefined}
        status={dto && !dto.ativo ? <Badge tone="neutral">inativo</Badge> : undefined}
        dirty={dirty}
        salvoEm={f.salvamento.salvoEm}
        actions={
          <>
            <Button
              variant="tertiary"
              onClick={() => {
                void nav("/fornecedores");
              }}
            >
              Fechar
            </Button>
            {podeEditar && (
              <Button
                variant="primary"
                loading={f.salvamento.estado === "saving"}
                onClick={() => {
                  void f.salvar();
                }}
              >
                Salvar
              </Button>
            )}
          </>
        }
      />

      {f.conflito && (
        <Alert
          tone="warning"
          title="Alguém alterou este fornecedor enquanto você editava"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void f.recarregar();
              }}
            >
              Recarregar
            </Button>
          }
        >
          Recarregue para ver os valores atuais e refaça a sua alteração.
        </Alert>
      )}
      {f.erroBloco !== null && <Alert tone="danger">{f.erroBloco}</Alert>}

      <Tabs tabs={tabs} active={tab} onChange={f.setTab}>
        <Tabs.Panel id="dados" active={tab}>
          <DadosFornecedorForm form={f.form} erros={f.erros} />
        </Tabs.Panel>
        <Tabs.Panel id="financeiro" active={tab}>
          {dto && (
            <RegrasTab
              fornecedor={dto}
              podeEditar={podeEditar}
              onMudou={(salvo) => {
                qc.setQueryData(chavesFornecedores.fornecedor(salvo.id), salvo);
              }}
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel id="reservas" active={tab}>
          {id && <ReservasFornecedorTab fornecedorId={id} />}
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
}
