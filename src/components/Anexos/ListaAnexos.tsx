import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { type AnexoDto, anexosApi, chavesAnexos } from "@/api/anexos";
import { chavesClientes, clientesApi } from "@/api/clientes";
import { PermissionError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import type { ReservaDto } from "@/api/viagens";
import { Button, IconButton } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, EmptyState, Skeleton, toast } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { AnexarModal } from "./AnexarModal";
import s from "./Anexos.module.css";

/** R10: a mesma lista serve a viagem (3.3) e a pessoa (3.4). */
export type EscopoAnexos = { viagemId: string; reservas: ReservaDto[] } | { clienteId: string };

type ListaAnexosProps = EscopoAnexos & { podeEnviar: boolean };

interface FonteAnexos {
  pessoa: boolean;
  chave: QueryKey;
  buscar: () => Promise<AnexoDto[]>;
  reservas: ReservaDto[];
}

function fonteAnexos(escopo: EscopoAnexos): FonteAnexos {
  if ("clienteId" in escopo) {
    const { clienteId } = escopo;
    return {
      pessoa: true,
      chave: chavesClientes.anexos(clienteId),
      buscar: () => clientesApi.anexos(clienteId),
      reservas: [],
    };
  }
  const { viagemId, reservas } = escopo;
  return {
    pessoa: false,
    chave: chavesAnexos.daViagem(viagemId),
    buscar: () => anexosApi.daViagem(viagemId),
    reservas,
  };
}

/** "reserva 1 · 212 KB · Guilherme" | "pessoa · sensível · descarte 28/10/2026" (protótipo #s-viagem). */
function descricaoAnexo(a: AnexoDto, reservas: ReservaDto[]): string {
  const indice = reservas.findIndex((r) => r.id === a.reservaId);
  const vinculo = a.vinculo === "cliente" ? "pessoa" : a.vinculo;
  const partes: string[] = [a.reservaId && indice >= 0 ? `reserva ${indice + 1}` : vinculo];
  if (a.sensivel) partes.push("sensível");
  if (a.tamanhoBytes) partes.push(`${Math.round(a.tamanhoBytes / 1024)} KB`);
  if (a.sensivel && a.dataDescarte) partes.push(`descarte ${formatarData(a.dataDescarte)}`);
  if (a.enviadoPorNome) partes.push(a.enviadoPorNome);
  return partes.join(" · ");
}

export function ListaAnexos(props: ListaAnexosProps) {
  const { podeEnviar } = props;
  const qc = useQueryClient();
  const [anexando, setAnexando] = useState(false);
  const [excluindo, setExcluindo] = useState<AnexoDto>();

  const fonte = fonteAnexos(props);
  const q = useQuery({ queryKey: fonte.chave, queryFn: fonte.buscar });
  function invalidar() {
    void qc.invalidateQueries({ queryKey: fonte.chave });
  }

  const excluir = useMutation({
    mutationFn: (a: AnexoDto) => anexosApi.excluir(a.id),
    onSettled: (_dados, erro) => {
      setExcluindo(undefined);
      if (erro) toast.error(mensagemDeErro(erro));
      invalidar();
    },
  });

  async function abrir(a: AnexoDto) {
    try {
      const { url } = await anexosApi.urlDownload(a.id);
      window.open(url, "_blank", "noopener");
    } catch (erro) {
      if (erro instanceof PermissionError) toast.error("Você não tem permissão para abrir documentos sensíveis.");
      else toast.error(mensagemDeErro(erro));
    }
  }

  const itens = q.data ?? [];
  return (
    <div className={s.bloco}>
      <div className={s.cabecalho}>
        <h3 className={s.titulo}>Anexos</h3>
        <span className={s.contagem}>{itens.length}</span>
        {podeEnviar && (
          <span className={s.acaoTopo}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAnexando(true);
              }}
            >
              + Anexar
            </Button>
          </span>
        )}
      </div>

      {q.isPending && <Skeleton lines={2} />}
      {q.isError && <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>}
      {!q.isPending && !q.isError && itens.length === 0 && (
        <EmptyState
          title="Nenhum anexo"
          description={
            fonte.pessoa
              ? "Documentos e comprovantes desta pessoa ficam aqui."
              : "Vouchers, comprovantes e contratos desta viagem ficam aqui."
          }
        />
      )}
      {itens.map((a) => (
        <div key={a.id} className={s.item}>
          <div className={s.texto}>
            <b className={s.nome}>{a.nomeArquivo}</b>
            <span className={s.meta}>{descricaoAnexo(a, fonte.reservas)}</span>
          </div>
          <div className={s.acoes}>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                void abrir(a);
              }}
            >
              Abrir
            </Button>
            {podeEnviar && (
              <IconButton
                label={`Excluir ${a.nomeArquivo}`}
                icon={<Trash2 size={20} />}
                onClick={() => {
                  setExcluindo(a);
                }}
              />
            )}
          </div>
        </div>
      ))}

      {anexando && (
        <AnexarModal
          open
          escopo={props}
          onClose={() => {
            setAnexando(false);
          }}
          onEnviado={invalidar}
        />
      )}
      {excluindo && (
        <ConfirmModal
          open
          title={`Excluir "${excluindo.nomeArquivo}"?`}
          impact={
            fonte.pessoa
              ? "O arquivo sai do cadastro e deixa de ser acessível. Isso não pode ser desfeito."
              : "O arquivo sai da viagem e deixa de ser acessível. Isso não pode ser desfeito."
          }
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
