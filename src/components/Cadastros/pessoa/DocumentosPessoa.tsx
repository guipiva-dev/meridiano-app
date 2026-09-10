import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { chavesClientes, clientesApi, type DocumentoDto } from "@/api/clientes";
import { mensagemDeErro } from "@/api/http";
import { Button, type Coluna, DataTable, DateCell } from "@/components";
import { ListaAnexos } from "@/components/anexos";
import { Alert, Badge } from "@/components/display";
import { ConfirmModal, toast } from "@/components/feedback";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { apresentacaoStatus } from "@/dominio/status";
import { situacaoValidade } from "@/lib/documentos";
import { DocumentoModal } from "./DocumentoModal";
import s from "./Pessoa.module.css";

interface DocumentosPessoaProps {
  clienteId: string;
  verDocumento: boolean;
  podeEditar: boolean;
}

const MASCARA = "•••••";

export function DocumentosPessoa({ clienteId, verDocumento, podeEditar }: DocumentosPessoaProps) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<DocumentoDto>();
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<DocumentoDto>();

  const chave = chavesClientes.documentos(clienteId);
  const q = useQuery({ queryKey: chave, queryFn: () => clientesApi.documentos(clienteId) });
  function invalidar() {
    void qc.invalidateQueries({ queryKey: chave });
  }

  const excluir = useMutation({
    mutationFn: (d: DocumentoDto) => clientesApi.excluirDocumento(d.id),
    onSettled: (_dados, erro) => {
      setExcluindo(undefined);
      if (erro) toast.error(mensagemDeErro(erro));
      invalidar();
    },
  });

  const colunas: Coluna<DocumentoDto>[] = [
    { id: "tipo", titulo: "Tipo", render: (d) => apresentacaoStatus("documento_tipo", d.tipo).texto },
    {
      id: "numero",
      titulo: "Número",
      render: (d) => <code className={s.mono}>{verDocumento ? (d.numero ?? MASCARA) : MASCARA}</code>,
    },
    { id: "emissao", titulo: "Emissão", render: (d) => <DateCell value={d.emissao} /> },
    {
      id: "validade",
      titulo: "Validade",
      render: (d) => {
        const situacao = situacaoValidade(d.diasParaVencer);
        return (
          <span className={s.validade}>
            <DateCell value={d.validade} />
            {d.diasParaVencer !== null && <Badge tone={situacao.tone}>{situacao.texto}</Badge>}
          </span>
        );
      },
    },
    { id: "pais", titulo: "País", render: (d) => d.paisEmissor ?? "—" },
  ];
  if (podeEditar) {
    colunas.push({
      id: "acoes",
      titulo: "",
      largura: "56px",
      render: (d) => {
        const itens: ItemMenu[] = [
          {
            label: "Editar",
            onClick: () => {
              setEditando(d);
              setAberto(true);
            },
          },
          {
            label: "Excluir",
            tone: "danger",
            onClick: () => {
              setExcluindo(d);
            },
          },
        ];
        return (
          <MenuAcoes label={`Ações do documento ${apresentacaoStatus("documento_tipo", d.tipo).texto}`} itens={itens} />
        );
      },
    });
  }

  return (
    <div className={s.painel}>
      <div className={s.bloco}>
        <div className={s.cabecalho}>
          <h3 className={s.titulo}>Documentos</h3>
          <span className={s.meta}>Alerta 180 dias antes de vencer · acesso registrado (LGPD)</span>
          {podeEditar && (
            <span className={s.acaoTopo}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditando(undefined);
                  setAberto(true);
                }}
              >
                + Documento
              </Button>
            </span>
          )}
        </div>
        {q.isError && <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>}
        <DataTable
          legenda="Documentos da pessoa"
          colunas={colunas}
          linhas={q.data ?? []}
          chave={(d) => d.id}
          carregando={q.isPending}
          vazio="Nenhum documento cadastrado"
        />
      </div>

      <ListaAnexos clienteId={clienteId} podeEnviar={podeEditar} />

      {aberto && (
        <DocumentoModal
          open
          clienteId={clienteId}
          documento={editando}
          onClose={() => {
            setAberto(false);
          }}
          onSalvo={invalidar}
        />
      )}
      {excluindo && (
        <ConfirmModal
          open
          title={`Excluir ${apresentacaoStatus("documento_tipo", excluindo.tipo).texto}?`}
          impact="O documento sai do cadastro da pessoa. Isso não pode ser desfeito."
          confirmLabel="Excluir"
          tone="danger"
          loading={excluir.isPending}
          onConfirm={() => {
            excluir.mutate(excluindo);
          }}
          onCancel={() => {
            setExcluindo(undefined);
          }}
        />
      )}
    </div>
  );
}
