import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { mensagemDeErro } from "@/api/errors";
import { chavesGrupos, gruposApi, type TipoGrupo } from "@/api/grupos";
import { useAuth } from "@/auth/useAuth";
import { Button, Field, Input, Select, Textarea } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, Skeleton } from "@/components/feedback";
import { Page, PageHeader, Section } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { cnpjValido } from "@/lib/documentos";
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
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  // "Novo grupo" começa sem tipo selecionado; o form tipa como obrigatório, mas o runtime começa undefined.
  const tipo = v.form.watch("tipo") as TipoGrupo | undefined;
  const nome = v.form.watch("nome");
  const cnpj = v.form.watch("cnpj");
  const observacoes = (v.form.watch("observacoes") as string | undefined) ?? "";
  const dirty = v.salvamento.estado === "dirty" || v.salvamento.estado === "error";
  // Só mostra "obrigatório" depois que o usuário passou pelo campo (evita erro no form em branco recém-aberto).
  const erroNome =
    v.erros.nome ?? (v.form.formState.touchedFields.nome && !nome.trim() ? "Nome é obrigatório" : undefined);
  const erroCnpj = v.erros.cnpj ?? (cnpj && !cnpjValido(cnpj) ? "CNPJ inválido" : undefined);

  useAtalho(
    "ctrl+s",
    () => {
      void v.salvar();
    },
    podeEditar,
  );

  const excluir = useMutation({
    mutationFn: () => gruposApi.excluir(id ?? ""),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["grupos", "lista"] });
      void nav("/clientes/grupos");
    },
    // Fecha o modal para o Alert de erro (abaixo do PageHeader) não ficar atrás do overlay.
    onError: () => {
      setConfirmarExclusao(false);
    },
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
    <Page dirty={dirty} titulo={v.dto?.nome ?? "Novo grupo"} onSalvarESair={podeEditar ? v.salvar : undefined}>
      <PageHeader
        title={v.dto?.nome ?? "Novo grupo"}
        subtitle={`${tipoTexto} · ${pessoas} pessoas · ${viagens} viagens`}
        dirty={dirty}
        salvoEm={v.salvamento.salvoEm}
        actions={
          <>
            {podeEditar && v.dto && (
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmarExclusao(true);
                }}
              >
                Excluir grupo
              </Button>
            )}
            <Button
              variant="tertiary"
              onClick={() => {
                void nav("/clientes/grupos");
              }}
            >
              Fechar
            </Button>
            {podeEditar && (
              <Button
                variant="primary"
                loading={v.salvamento.estado === "saving"}
                onClick={() => {
                  void v.salvar();
                }}
              >
                Salvar
              </Button>
            )}
          </>
        }
      />

      {excluir.isError && <Alert tone="danger">{mensagemDeErro(excluir.error)}</Alert>}
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
          <Field label="Nome" required className="span-6" error={erroNome}>
            <Input autoComplete="off" maxLength={150} {...v.form.register("nome")} />
          </Field>
          <Field label="Tipo" className="span-3" error={v.erros.tipo}>
            <Select options={OPCOES_TIPO} {...v.form.register("tipo")} />
          </Field>
          <Field label="CNPJ" className="span-3" helper={tipo === "empresa" ? undefined : "(empresa)"} error={erroCnpj}>
            <Input className={s.mono} disabled={tipo !== "empresa"} {...v.form.register("cnpj")} />
          </Field>
          <Field label="Observações" helper={`${observacoes.length}/2000`} className="span-12">
            <Textarea maxLength={2000} {...v.form.register("observacoes")} />
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

      {confirmarExclusao && (
        <ConfirmModal
          open
          title={`Excluir ${v.dto?.nome ?? "grupo"}?`}
          impact="Esta ação não pode ser desfeita. As pessoas do grupo não são excluídas."
          confirmLabel="Excluir"
          tone="danger"
          loading={excluir.isPending}
          onConfirm={() => {
            excluir.mutate();
          }}
          onCancel={() => {
            setConfirmarExclusao(false);
          }}
        />
      )}
    </Page>
  );
}
