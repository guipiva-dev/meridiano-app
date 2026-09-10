import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type AtendimentoDto, type Canal, chavesClientes, clientesApi } from "@/api/clientes";
import { mensagemDeErro } from "@/api/http";
import { Button, Select } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, EmptyState, Skeleton, toast } from "@/components/feedback";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { apresentacaoStatus } from "@/dominio/status";
import { AtendimentoModal } from "./AtendimentoModal";
import { agruparAtendimentos, type GrupoAtendimentos } from "./agruparAtendimentos";
import { OPCOES_CANAL } from "./canais";
import s from "./Pessoa.module.css";

interface AtendimentosPessoaProps {
  clienteId: string;
  podeEditar: boolean;
}

/** "dd/mm · Guilherme" — carimbo curto do rodapé de cada linha. */
function metaDoItem(a: AtendimentoDto): string {
  const dia = new Date(a.ocorridoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return a.usuarioNome ? `${dia} · ${a.usuarioNome}` : dia;
}

export function AtendimentosPessoa({ clienteId, podeEditar }: AtendimentosPessoaProps) {
  const qc = useQueryClient();
  const [canal, setCanal] = useState<Canal | "">("");
  const [editando, setEditando] = useState<AtendimentoDto>();
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<AtendimentoDto>();

  const filtro = canal === "" ? undefined : canal;
  const chave = chavesClientes.atendimentos(clienteId, filtro);
  const q = useQuery({ queryKey: chave, queryFn: () => clientesApi.atendimentos(clienteId, filtro) });
  function invalidar() {
    void qc.invalidateQueries({ queryKey: chavesClientes.atendimentos(clienteId).slice(0, 3) });
  }

  const excluir = useMutation({
    mutationFn: (a: AtendimentoDto) => clientesApi.excluirAtendimento(a.id),
    onSettled: (_dados, erro) => {
      setExcluindo(undefined);
      if (erro) toast.error(mensagemDeErro(erro));
      invalidar();
    },
  });

  const itens = q.data ?? [];
  const grupos = agruparAtendimentos(itens, new Date());

  function linha(a: AtendimentoDto) {
    const itensMenu: ItemMenu[] = [
      {
        label: "Editar",
        onClick: () => {
          setEditando(a);
          setAberto(true);
        },
      },
      {
        label: "Excluir",
        tone: "danger",
        onClick: () => {
          setExcluindo(a);
        },
      },
    ];
    return (
      <div key={a.id} className={s.item}>
        <div className={s.texto}>
          <span className={s.primary}>
            <b>{apresentacaoStatus("canal", a.canal).texto}</b> · <span>{a.resumo}</span>
          </span>
          <span className={s.meta}>{metaDoItem(a)}</span>
        </div>
        {podeEditar && (
          <div className={s.acoes}>
            <MenuAcoes label={`Ações do atendimento de ${metaDoItem(a)}`} itens={itensMenu} />
          </div>
        )}
      </div>
    );
  }

  function bloco(g: GrupoAtendimentos) {
    if (g.recolhido) {
      return (
        <details key={g.chave} className={s.grupo}>
          <summary className={s.grupoTitulo}>{g.titulo}</summary>
          {g.itens.map(linha)}
        </details>
      );
    }
    return (
      <div key={g.chave} className={s.grupo}>
        <h4 className={s.grupoTitulo}>{g.titulo}</h4>
        {g.itens.map(linha)}
      </div>
    );
  }

  return (
    <div className={s.painel}>
      <div className={s.topo}>
        {podeEditar && (
          <Button
            variant="primary"
            onClick={() => {
              setEditando(undefined);
              setAberto(true);
            }}
          >
            + Registrar atendimento
          </Button>
        )}
        <Select
          aria-label="Canal"
          value={canal}
          placeholder="Canal: todos"
          options={OPCOES_CANAL}
          onChange={(e) => {
            setCanal(e.target.value as Canal | "");
          }}
        />
        <span className={s.contagem}>
          {itens.length} {itens.length === 1 ? "registro" : "registros"} · agrupados por mês
        </span>
      </div>

      {q.isPending && <Skeleton lines={3} />}
      {q.isError && <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>}
      {!q.isPending && !q.isError && itens.length === 0 && (
        <EmptyState
          title="Nenhum atendimento"
          description="Registre ligações, mensagens e visitas para manter o histórico da pessoa."
        />
      )}
      {grupos.length > 0 && <div className={s.bloco}>{grupos.map(bloco)}</div>}

      {aberto && (
        <AtendimentoModal
          open
          clienteId={clienteId}
          atendimento={editando}
          onClose={() => {
            setAberto(false);
          }}
          onSalvo={invalidar}
        />
      )}
      {excluindo && (
        <ConfirmModal
          open
          title="Excluir atendimento?"
          impact="O registro sai do histórico da pessoa. Isso não pode ser desfeito."
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
