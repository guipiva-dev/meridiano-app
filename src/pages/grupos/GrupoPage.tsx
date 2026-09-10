import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { chavesGrupos, type TipoGrupo } from "@/api/grupos";
import { useAuth } from "@/auth/useAuth";
import { Button, Field, Input, Select, Textarea } from "@/components";
import { Alert } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { Page, PageHeader, Section } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { useAtalho } from "@/lib/useAtalho";
import s from "./Grupos.module.css";
import { PessoasDoGrupo } from "./PessoasDoGrupo";
import { useGrupo } from "./useGrupo";

const TIPOS: TipoGrupo[] = ["familia", "empresa", "outro"];
const OPCOES_TIPO = TIPOS.map((t) => ({ value: t, label: apresentacaoStatus("grupo_tipo", t).texto }));

export function GrupoPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { pode } = useAuth();
  const v = useGrupo(id);
  const podeEditar = pode("cliente.editar");

  // "Novo grupo" começa sem tipo selecionado; o form tipa como obrigatório, mas o runtime começa undefined.
  const tipo = v.form.watch("tipo") as TipoGrupo | undefined;
  const dirty = v.salvamento.estado === "dirty" || v.salvamento.estado === "error";

  useAtalho("ctrl+s", () => {
    void v.salvar();
  });

  if (v.carregando) {
    return (
      <Page>
        <Skeleton lines={4} />
      </Page>
    );
  }

  const tipoTexto = apresentacaoStatus("grupo_tipo", tipo ?? "familia").texto;
  const pessoas = v.dto?.pessoas.length ?? 0;
  const viagens = v.dto?.viagens ?? 0;

  return (
    <Page dirty={dirty} titulo={v.dto?.nome ?? "Novo grupo"} onSalvarESair={v.salvar}>
      <PageHeader
        title={v.dto?.nome ?? "Novo grupo"}
        subtitle={`${tipoTexto} · ${pessoas} pessoas · ${viagens} viagens`}
        dirty={dirty}
        salvoEm={v.salvamento.salvoEm}
        actions={
          <>
            <Button
              variant="tertiary"
              onClick={() => {
                void nav(-1);
              }}
            >
              Fechar
            </Button>
            <Button
              variant="primary"
              loading={v.salvamento.estado === "saving"}
              onClick={() => {
                void v.salvar();
              }}
            >
              Salvar
            </Button>
          </>
        }
      />

      {v.conflito && (
        <Alert
          tone="warning"
          title="Alguém alterou este grupo enquanto você editava"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void v.recarregar();
              }}
            >
              Recarregar
            </Button>
          }
        >
          Recarregue para ver os dados atuais e refaça a sua alteração.
        </Alert>
      )}
      {v.erroBloco !== null && <Alert tone="danger">{v.erroBloco}</Alert>}

      <Section>
        <div className="grid-form">
          <Field label="Nome" required className="span-6" error={v.erros.nome}>
            <Input autoComplete="off" {...v.form.register("nome")} />
          </Field>
          <Field label="Tipo" className="span-3" error={v.erros.tipo}>
            <Select options={OPCOES_TIPO} {...v.form.register("tipo")} />
          </Field>
          <Field
            label="CNPJ"
            className="span-3"
            helper={tipo === "empresa" ? undefined : "(empresa)"}
            error={v.erros.cnpj}
          >
            <Input className={s.mono} disabled={tipo !== "empresa"} {...v.form.register("cnpj")} />
          </Field>
          <Field label="Observações" className="span-12">
            <Textarea {...v.form.register("observacoes")} />
          </Field>
        </div>
      </Section>

      {v.dto && (
        <Section>
          <PessoasDoGrupo
            grupo={v.dto}
            podeEditar={podeEditar}
            onMudou={() => {
              const grupoId = v.dto?.id;
              if (grupoId) void qc.invalidateQueries({ queryKey: chavesGrupos.grupo(grupoId) });
            }}
          />
        </Section>
      )}
    </Page>
  );
}
