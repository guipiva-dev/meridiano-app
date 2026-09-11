import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { ColaboradorDto } from "@/api/equipe";
import { chavesEquipe, equipeApi } from "@/api/equipe";
import { mensagemDeErro } from "@/api/errors";
import { Button, type Coluna, DataTable } from "@/components";
import { Alert, Badge } from "@/components/display";
import { toast } from "@/components/feedback";
import { Page, PageHeader } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarCarimboRelativo } from "@/lib/datas";
import { ConvidarModal } from "./ConvidarModal";
import s from "./Equipe.module.css";
import { ROTULO_PERFIL } from "./perfis";

function formatarPercentual(p: number): string {
  const texto = p % 1 === 0 ? String(p) : p.toFixed(1).replace(".", ",");
  return `${texto} %`;
}

function diasAteCarimbo(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function conviteExpirado(c: ColaboradorDto): boolean {
  return c.acesso === "sem_acesso" && !!c.conviteExpiraEm && new Date(c.conviteExpiraEm).getTime() < Date.now();
}

/** Acesso combina o mapa `acesso` (status.ts) com o prazo do convite quando aplicável. */
function rotuloAcesso(c: ColaboradorDto): { texto: string; tone: ReturnType<typeof apresentacaoStatus>["tone"] } {
  const base = apresentacaoStatus("acesso", c.acesso);
  if (c.acesso === "convite_pendente" && c.conviteExpiraEm) {
    const dias = diasAteCarimbo(c.conviteExpiraEm);
    return { texto: `convite expira em ${dias} dia${dias === 1 ? "" : "s"}`, tone: base.tone };
  }
  if (conviteExpirado(c)) return { texto: "convite expirado", tone: base.tone };
  return base;
}

export function EquipePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [convidarAberto, setConvidarAberto] = useState(false);

  const listaQ = useQuery({ queryKey: chavesEquipe.lista(), queryFn: equipeApi.listar });
  const itens = listaQ.data?.itens ?? [];

  function invalidar() {
    void qc.invalidateQueries({ queryKey: chavesEquipe.lista() });
  }

  async function convidar(c: ColaboradorDto) {
    try {
      await equipeApi.convidar(c.id);
      toast.success(`Convite enviado para ${c.email}`);
      invalidar();
    } catch (e) {
      toast.error(mensagemDeErro(e));
    }
  }

  const colunas: Coluna<ColaboradorDto>[] = [
    {
      id: "nome",
      titulo: "Colaborador",
      render: (c) => (
        <>
          <div className={s.primary}>{c.nome}</div>
          <div className={s.secondary}>
            {c.perfil === "vendedor_externo" && c.acesso === "sem_acesso"
              ? "vendedor externo · aparece nas viagens e repasses; não usa o sistema"
              : c.email}
          </div>
        </>
      ),
    },
    { id: "perfil", titulo: "Perfil", render: (c) => <span>{ROTULO_PERFIL[c.perfil] ?? c.perfil}</span> },
    {
      id: "repasse",
      titulo: "Repasse",
      render: (c) => <span>{c.geraRepasse ? `gera · sugestão ${formatarPercentual(c.percentualPadrao)}` : "—"}</span>,
    },
    {
      id: "ultimoAcesso",
      titulo: "Último acesso",
      render: (c) => <span>{formatarCarimboRelativo(c.ultimoLoginEm)}</span>,
    },
    {
      id: "acesso",
      titulo: "Acesso",
      render: (c) => {
        const r = rotuloAcesso(c);
        return <Badge tone={r.tone}>{r.texto}</Badge>;
      },
    },
    {
      id: "acao",
      titulo: "",
      alinhar: "right",
      render: (c) =>
        c.acesso === "sem_acesso" || c.acesso === "convite_pendente" ? (
          <Button
            variant="tertiary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void convidar(c);
            }}
          >
            {c.acesso === "sem_acesso" && !conviteExpirado(c) ? "Convidar" : "Reenviar"}
          </Button>
        ) : (
          <Button
            variant="tertiary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void nav(`/equipe/${c.id}`);
            }}
          >
            Editar
          </Button>
        ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Equipe e acessos"
        subtitle={
          listaQ.data
            ? `${listaQ.data.total} pessoas na equipe · ${listaQ.data.comAcesso} com acesso · ${listaQ.data.convitesPendentes} convite${listaQ.data.convitesPendentes === 1 ? "" : "s"} pendente${listaQ.data.convitesPendentes === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                void nav("/equipe/nova");
              }}
            >
              + Colaborador sem acesso
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConvidarAberto(true);
              }}
            >
              + Convidar para acessar
            </Button>
          </>
        }
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
          legenda="Equipe e acessos"
          colunas={colunas}
          linhas={itens}
          chave={(c) => c.id}
          carregando={listaQ.isLoading}
          onLinha={(c) => {
            void nav(`/equipe/${c.id}`);
          }}
          vazio="Nenhum colaborador cadastrado."
        />
      )}

      <ConvidarModal
        open={convidarAberto}
        onClose={() => {
          setConvidarAberto(false);
        }}
        onConvidado={invalidar}
      />
    </Page>
  );
}
