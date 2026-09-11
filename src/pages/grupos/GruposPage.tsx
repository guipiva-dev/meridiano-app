import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { chavesGrupos, gruposApi, type ListaGrupoDto } from "@/api/grupos";
import { useAuth } from "@/auth/useAuth";
import { Button, type Coluna, DataTable, Input, Paginacao, StatusCell } from "@/components";
import { EmptyState } from "@/components/feedback";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { formatarCnpj } from "@/lib/documentos";
import { subnavs } from "@/shell/navegacao";
import s from "./Grupos.module.css";

const DEBOUNCE_MS = 300;

export function GruposPage() {
  const nav = useNavigate();
  const { pode } = useAuth();
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const listaQ = useQuery({
    queryKey: chavesGrupos.lista(q, pagina),
    queryFn: () => gruposApi.listar(q, pagina),
    placeholderData: keepPreviousData,
  });

  const itens = listaQ.data?.itens ?? [];
  const total = listaQ.data?.total ?? 0;

  function mudarBusca(valor: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQ(valor);
      setPagina(1);
    }, DEBOUNCE_MS);
  }

  const colunas = useMemo<Coluna<ListaGrupoDto>[]>(
    () => [
      {
        id: "grupo",
        titulo: "Grupo",
        render: (g) => (
          <div>
            <div className={s.primary}>{g.nome}</div>
            <div className={s.secondary}>{g.pessoasResumo}</div>
          </div>
        ),
      },
      { id: "tipo", titulo: "Tipo", render: (g) => <StatusCell entidade="grupo_tipo" valor={g.tipo} /> },
      { id: "cnpj", titulo: "CNPJ", render: (g) => (g.cnpj ? <code>{formatarCnpj(g.cnpj)}</code> : "—") },
      { id: "pessoas", titulo: "Pessoas", alinhar: "right", render: (g) => g.pessoas },
      { id: "viagens", titulo: "Viagens", alinhar: "right", render: (g) => g.viagens },
    ],
    [],
  );

  return (
    <Page>
      <PageHeader
        title="Grupos e empresas"
        subtitle={`${total} grupos · organizam o cadastro de pessoas; não têm valor financeiro`}
        actions={
          pode("cliente.editar") && (
            <Button
              variant="primary"
              icon={<Plus size={20} />}
              onClick={() => {
                void nav("/clientes/grupos/nova");
              }}
            >
              + Novo grupo
            </Button>
          )
        }
      />
      <Subnav items={subnavs["/clientes"] ?? []} />

      <Input
        aria-label="Buscar grupo"
        placeholder="Buscar por nome…"
        className={s.busca}
        defaultValue={q}
        onChange={(e) => {
          mudarBusca(e.target.value);
        }}
      />

      <DataTable
        legenda="Grupos"
        colunas={colunas}
        linhas={itens}
        chave={(g) => g.id}
        carregando={listaQ.isLoading}
        onLinha={(g) => {
          void nav(`/clientes/grupos/${g.id}`);
        }}
        rotuloLinha={(g) => g.nome}
        vazio={
          <EmptyState
            title="Nenhum grupo por aqui"
            description="Crie um grupo para organizar famílias ou empresas que viajam juntas."
          />
        }
        rodape={<Paginacao pagina={pagina} tamanho={listaQ.data?.tamanho ?? 25} total={total} onPagina={setPagina} />}
      />
    </Page>
  );
}
