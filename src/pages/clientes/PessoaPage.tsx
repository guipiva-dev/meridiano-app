import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { clientesApi } from "@/api/clientes";
import { mensagemDeErro, ValidationError } from "@/api/errors";
import { chavesGrupos } from "@/api/grupos";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components";
import { GrupoInlineModal } from "@/components/cadastros";
import { Alert, Badge } from "@/components/display";
import { ConfirmModal, Skeleton } from "@/components/feedback";
import { Page, PageHeader, Subnav } from "@/components/shell";
import { formatarCpf } from "@/lib/documentos";
import { useAtalho } from "@/lib/useAtalho";
import { subnavs } from "@/shell/navegacao";
import { DadosPessoaForm } from "./DadosPessoaForm";
import { TabsPessoa } from "./TabsPessoa";
import { usePessoa } from "./usePessoa";

export function PessoaPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { pode } = useAuth();
  const v = usePessoa(id);
  const [grupoAberto, setGrupoAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const podeEditar = pode("cliente.editar");
  const verDocumento = pode("cliente.ver_documento");
  const dirty = v.salvamento.estado === "dirty" || v.salvamento.estado === "error";
  const titulo = v.dto?.nome ?? "Nova pessoa";

  useAtalho(
    "ctrl+s",
    () => {
      void v.salvar();
    },
    podeEditar,
  );

  const excluir = useMutation({
    mutationFn: () => clientesApi.excluir(id ?? ""),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["clientes", "lista"] });
      void nav("/clientes");
    },
    // Fecha o modal para o Alert de erro (abaixo do PageHeader) não ficar atrás do overlay.
    onError: () => {
      setConfirmarExclusao(false);
    },
  });

  if (v.carregando) {
    return (
      <Page>
        <Skeleton lines={6} />
      </Page>
    );
  }

  // Com `id` e sem DTO depois da carga, a busca falhou: nem "Nova pessoa" nem formulário em branco.
  if (id && !v.dto) {
    const naoEncontrada = v.erroCarga instanceof ValidationError && v.erroCarga.codigo === "nao_encontrado";
    return (
      <Page>
        <Alert
          tone="danger"
          action={
            naoEncontrada ? (
              <Button
                variant="secondary"
                onClick={() => {
                  void nav("/clientes");
                }}
              >
                Ver lista
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  void v.recarregar();
                }}
              >
                Tentar de novo
              </Button>
            )
          }
        >
          {naoEncontrada ? "Pessoa não encontrada ou excluída." : "Não foi possível carregar esta pessoa."}
        </Alert>
      </Page>
    );
  }

  const resumo = v.dto?.resumo;
  const partes: string[] = [];
  if (v.dto?.cpf) partes.push(formatarCpf(v.dto.cpf));
  if (v.dto?.grupoNome) partes.push(v.dto.grupoNome);
  if (resumo) partes.push(`${resumo.viagens} viagens`, `cliente desde ${resumo.clienteDesde}`);

  const temVinculos = (resumo?.viagens ?? 0) > 0;

  const formulario = (
    <DadosPessoaForm
      form={v.form}
      grupos={v.grupos}
      erros={v.erros}
      verDocumento={verDocumento}
      onNovoGrupo={() => {
        setGrupoAberto(true);
      }}
    />
  );

  return (
    <Page dirty={dirty} titulo={titulo} onSalvarESair={podeEditar ? v.salvar : undefined}>
      <PageHeader
        title={titulo}
        subtitle={partes.length > 0 ? partes.join(" · ") : undefined}
        status={v.pendenciasAbertas > 0 && <Badge tone="warning">{v.pendenciasAbertas} pendências</Badge>}
        dirty={dirty}
        salvoEm={v.salvamento.salvoEm}
        actions={
          <>
            {podeEditar && v.dto && (
              <Button
                variant="secondary"
                disabled={temVinculos}
                title={temVinculos ? "Tem viagem ou crédito; não pode ser excluída" : undefined}
                onClick={() => {
                  setConfirmarExclusao(true);
                }}
              >
                Excluir cliente
              </Button>
            )}
            <Button
              variant="tertiary"
              onClick={() => {
                void nav("/clientes");
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
      <Subnav items={subnavs["/clientes"] ?? []} />

      {excluir.isError && <Alert tone="danger">{mensagemDeErro(excluir.error)}</Alert>}
      {v.conflito && (
        <Alert
          tone="warning"
          title="Alguém alterou esta pessoa enquanto você editava"
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

      {id ? (
        <TabsPessoa
          clienteId={id}
          pessoa={v}
          podeEditar={podeEditar}
          verDocumento={verDocumento}
          formulario={formulario}
        />
      ) : (
        formulario
      )}

      <GrupoInlineModal
        open={grupoAberto}
        onClose={() => {
          setGrupoAberto(false);
        }}
        onCriado={(g) => {
          void qc.invalidateQueries({ queryKey: chavesGrupos.lista("", 1).slice(0, 2) });
          v.form.setValue("grupoId", g.id, { shouldDirty: true });
        }}
      />

      {confirmarExclusao && (
        <ConfirmModal
          open
          title={`Excluir ${v.dto?.nome ?? "cliente"}?`}
          impact="Esta ação não pode ser desfeita."
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
