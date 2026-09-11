import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Field, Input, Select, StatusCell } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, Skeleton } from "@/components/feedback";
import { Page, PageHeader, Section } from "@/components/shell";
import { useAtalho } from "@/lib/useAtalho";
import s from "./Equipe.module.css";
import { PerfilVe } from "./PerfilVe";
import { OPCOES_PERFIL, ROTULO_PERFIL } from "./perfis";
import { useColaborador } from "./useColaborador";

const OPCOES_SIM_NAO = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];
const OPCOES_SITUACAO = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

export function ColaboradorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const v = useColaborador(id);
  const [confirmarInativar, setConfirmarInativar] = useState(false);

  const dirty = v.salvamento.estado === "dirty" || v.salvamento.estado === "error";
  const perfilSelecionado = v.form.watch("perfil");
  const geraRepasse = v.form.watch("geraRepasse");
  const titulo = v.dto?.nome ?? "Novo colaborador";

  useAtalho(
    "ctrl+s",
    () => {
      void v.salvar();
    },
    true,
  );

  if (v.carregando) {
    return (
      <Page>
        <Skeleton lines={6} />
      </Page>
    );
  }

  if (id && !v.dto) {
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
          Não foi possível carregar este colaborador.
        </Alert>
      </Page>
    );
  }

  const mostrarConvite = v.dto && (v.dto.acesso === "sem_acesso" || v.dto.acesso === "convite_pendente");

  return (
    <Page dirty={dirty} titulo={titulo} onSalvarESair={v.salvar}>
      <PageHeader
        title={titulo}
        subtitle={v.dto ? `${ROTULO_PERFIL[v.dto.perfil] ?? v.dto.perfil} · ${v.dto.email}` : undefined}
        status={v.dto && <StatusCell entidade="acesso" valor={v.dto.acesso} />}
        dirty={dirty}
        salvoEm={v.salvamento.salvoEm}
        actions={
          <>
            {mostrarConvite && (
              <Button
                variant="secondary"
                onClick={() => {
                  void v.convidar();
                }}
              >
                {v.dto?.acesso === "sem_acesso" ? "Convidar para acessar" : "Reenviar convite"}
              </Button>
            )}
            <Button
              variant="tertiary"
              onClick={() => {
                void nav("/equipe");
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
          title="Alguém alterou este colaborador enquanto você editava"
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

      <div className={s.layout}>
        <Section title="Dados">
          <div className="grid-form">
            <Field label="Nome" required className="span-6" error={v.erros.nome}>
              <Input autoComplete="off" {...v.form.register("nome")} />
            </Field>
            {id ? (
              <Field label="E-mail" className="span-6">
                <span className={s.emailFixo}>{v.dto?.email}</span>
              </Field>
            ) : (
              <Field label="E-mail" required className="span-6" error={v.erros.email}>
                <Input type="email" autoComplete="off" {...v.form.register("email")} />
              </Field>
            )}
            <Field label="Telefone" className="span-3">
              <Input autoComplete="off" {...v.form.register("telefone")} />
            </Field>
            <Field label="Perfil" className="span-3" error={v.erros.perfil}>
              <Select options={OPCOES_PERFIL} {...v.form.register("perfil")} />
            </Field>
            <Field label="Gera repasse" className="span-3">
              <Select
                options={OPCOES_SIM_NAO}
                value={String(geraRepasse)}
                onChange={(e) => {
                  v.form.setValue("geraRepasse", e.target.value === "true", { shouldDirty: true });
                }}
              />
            </Field>
            {geraRepasse && (
              <Field label="Sugestão de %" className="span-3" error={v.erros.percentualPadrao}>
                <Input
                  type="number"
                  step="0.1"
                  autoComplete="off"
                  {...v.form.register("percentualPadrao", { valueAsNumber: true })}
                />
              </Field>
            )}
            {id && (
              <Field label="Situação" className="span-3">
                <Select
                  options={OPCOES_SITUACAO}
                  value={String(v.form.watch("ativo"))}
                  onChange={(e) => {
                    if (e.target.value === "false" && v.form.getValues("ativo")) {
                      setConfirmarInativar(true);
                      return;
                    }
                    v.form.setValue("ativo", e.target.value === "true", { shouldDirty: true });
                  }}
                />
              </Field>
            )}
          </div>
        </Section>

        <PerfilVe perfis={v.perfis} perfil={perfilSelecionado} />
      </div>

      <ConfirmModal
        open={confirmarInativar}
        title={`Inativar ${v.dto?.nome ?? ""}?`}
        impact="Perde o acesso na próxima requisição."
        confirmLabel="Inativar"
        tone="danger"
        onCancel={() => {
          setConfirmarInativar(false);
        }}
        onConfirm={() => {
          v.form.setValue("ativo", false, { shouldDirty: true });
          setConfirmarInativar(false);
        }}
      />
    </Page>
  );
}
