import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { ColaboradorDto } from "@/api/equipe";
import { chavesEquipe, equipeApi } from "@/api/equipe";
import { mensagemDeErro } from "@/api/errors";
import { Button, type Coluna, DataTable, StatusCell } from "@/components";
import { Alert } from "@/components/display";
import { toast } from "@/components/feedback";
import { Page, PageHeader } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { ConvidarModal } from "./ConvidarModal";
import s from "./Equipe.module.css";
import { ROTULO_PERFIL } from "./perfis";

/** yyyy-mm-ddTHH:mm:ssZ → "hoje 09:12" · "ontem 18:40" · "02/04". */
function formatarUltimoAcesso(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return `hoje ${hora}`;
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return `ontem ${hora}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatarPercentual(p: number): string {
  const texto = p % 1 === 0 ? String(p) : p.toFixed(1).replace(".", ",");
  return `${texto} %`;
}

function diasAteCarimbo(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Acesso combina o mapa `acesso` (status.ts) com o prazo do convite quando aplicável. */
function rotuloAcesso(c: ColaboradorDto): { texto: string; tone: ReturnType<typeof apresentacaoStatus>["tone"] } {
  const base = apresentacaoStatus("acesso", c.acesso);
  if (c.acesso === "convite_pendente" && c.conviteExpiraEm) {
    const dias = diasAteCarimbo(c.conviteExpiraEm);
    return { texto: `convite expira em ${dias} dia${dias === 1 ? "" : "s"}`, tone: base.tone };
  }
  if (c.acesso === "sem_acesso" && c.conviteExpiraEm && new Date(c.conviteExpiraEm).getTime() < Date.now()) {
    return { texto: "convite expirado", tone: base.tone };
  }
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
    await equipeApi.convidar(c.id);
    toast.success(`Convite enviado para ${c.email}`);
    invalidar();
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
      render: (c) => <span>{formatarUltimoAcesso(c.ultimoLoginEm)}</span>,
    },
    {
      id: "acesso",
      titulo: "Acesso",
      render: (c) => {
        const r = rotuloAcesso(c);
        return r.texto === apresentacaoStatus("acesso", c.acesso).texto ? (
          <StatusCell entidade="acesso" valor={c.acesso} />
        ) : (
          <span data-tone={r.tone}>{r.texto}</span>
        );
      },
    },
    {
      id: "acao",
      titulo: "",
      alinhar: "right",
      render: (c) =>
        c.acesso === "sem_acesso" ? (
          <Button
            variant="tertiary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void convidar(c);
            }}
          >
            Convidar
          </Button>
        ) : c.acesso === "convite_pendente" ? (
          <Button
            variant="tertiary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void convidar(c);
            }}
          >
            Reenviar
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
