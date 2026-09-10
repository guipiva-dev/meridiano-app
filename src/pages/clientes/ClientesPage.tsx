import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router";
import { chavesClientes, clientesApi, type FiltroClientes, type ListaClienteDto } from "@/api/clientes";
import { mensagemDeErro } from "@/api/errors";
import { chavesGrupos, gruposApi } from "@/api/grupos";
import { useAuth } from "@/auth/useAuth";
import { Button, type Coluna, DataTable, Paginacao } from "@/components";
import { Alert, Badge } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { formatarMesAno } from "@/lib/datas";
import { formatarTelefone } from "@/lib/documentos";
import { subnavs } from "@/shell/navegacao";
import s from "./Clientes.module.css";
import { FiltrosClientes } from "./FiltrosClientes";
import { useFiltrosClientes } from "./useFiltrosClientes";

const CONTADORES_VAZIOS = { pessoas: 0, grupos: 0, passaportesVencendo: 0 };

function pendencias(l: ListaClienteDto): ReactNode {
  if (l.pendenciasAbertas === 0) return "—";
  if (l.pendenciasUrgentes > 0) return <Badge tone="warning">{l.pendenciasAbertas} · urgente</Badge>;
  return <Badge tone="info">{l.pendenciasAbertas}</Badge>;
}

/** "Lisboa · abr/2026"; cancelada troca o destino por "cancelada" (protótipo #s-clientes). */
function ultimaViagem(l: ListaClienteDto): string {
  if (!l.ultimaViagemData && !l.ultimaViagemDestino) return "—";
  const quem = l.ultimaViagemCancelada ? "cancelada" : (l.ultimaViagemDestino ?? "—");
  return `${quem} · ${formatarMesAno(l.ultimaViagemData)}`;
}

export function ClientesPage() {
  const nav = useNavigate();
  const { pode } = useAuth();
  const { filtro, definir, limpar, ativos } = useFiltrosClientes();

  const gruposQ = useQuery({ queryKey: chavesGrupos.lista("", 1), queryFn: () => gruposApi.listar("", 1) });
  const listaQ = useQuery({
    queryKey: chavesClientes.lista(filtro),
    queryFn: () => clientesApi.listar(filtro),
    placeholderData: keepPreviousData,
  });

  const itens = listaQ.data?.itens ?? [];
  const contadores = listaQ.data?.contadores ?? CONTADORES_VAZIOS;

  const colunas = useMemo<Coluna<ListaClienteDto>[]>(
    () => [
      {
        id: "nome",
        titulo: "Pessoa",
        ordenavel: true,
        render: (l) => (
          <div>
            <div className={s.primary}>{l.nome}</div>
            <div className={s.secondary}>
              {l.cpfMascarado && <code>{l.cpfMascarado}</code>}
              {l.cpfMascarado && l.idade !== null && " · "}
              {l.idade !== null && `${l.idade} anos`}
            </div>
          </div>
        ),
      },
      { id: "grupo", titulo: "Grupo", render: (l) => l.grupoNome ?? "—" },
      { id: "contato", titulo: "Contato", render: (l) => formatarTelefone(l.contato) || "—" },
      { id: "pendencias", titulo: "Pendências", render: pendencias },
      { id: "ultima_viagem", titulo: "Última viagem", ordenavel: true, render: ultimaViagem },
      { id: "viagens", titulo: "Viagens", alinhar: "right", render: (l) => l.viagens },
    ],
    [],
  );

  return (
    <Page>
      <PageHeader
        title="Clientes"
        subtitle={`${contadores.pessoas} pessoas · ${contadores.grupos} grupos · ${contadores.passaportesVencendo} passaportes vencendo`}
        actions={
          pode("cliente.editar") && (
            <Button
              variant="primary"
              icon={<Plus size={20} />}
              onClick={() => {
                void nav("/clientes/nova");
              }}
            >
              + Nova pessoa
            </Button>
          )
        }
      />
      <Subnav items={subnavs["/clientes"] ?? []} />

      <FiltrosClientes
        filtro={filtro}
        definir={definir}
        limpar={limpar}
        ativos={ativos}
        grupos={gruposQ.data?.itens ?? []}
      />

      {listaQ.isError ? (
        <Alert
          tone="danger"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void listaQ.refetch();
              }}
            >
              Tentar de novo
            </Button>
          }
        >
          {mensagemDeErro(listaQ.error)}
        </Alert>
      ) : (
        <DataTable
          legenda="Pessoas"
          colunas={colunas}
          linhas={itens}
          chave={(l) => l.id}
          carregando={listaQ.isLoading}
          onLinha={(l) => {
            void nav(`/clientes/${l.id}`);
          }}
          rotuloLinha={(l) => l.nome}
          ordenacao={{ campo: filtro.ordem ?? "nome", direcao: filtro.direcao ?? "asc" }}
          onOrdenar={(o) => {
            definir({ ordem: o.campo as FiltroClientes["ordem"], direcao: o.direcao });
          }}
          vazio={
            <EmptyState
              title="Nenhuma pessoa por aqui"
              description="Nada bate com os filtros. Limpe os filtros ou cadastre a primeira pessoa."
              action={
                <Button variant="secondary" onClick={limpar}>
                  Limpar filtros
                </Button>
              }
            />
          }
          rodape={
            <Paginacao
              pagina={filtro.pagina ?? 1}
              tamanho={filtro.tamanho ?? 25}
              total={listaQ.data?.total ?? 0}
              onPagina={(p) => {
                definir({ pagina: p });
              }}
            />
          }
        />
      )}
    </Page>
  );
}
