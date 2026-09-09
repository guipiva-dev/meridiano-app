import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { type AnexoDto, anexosApi, chavesAnexos } from "@/api/anexos";
import { PermissionError } from "@/api/errors";
import { mensagemDeErro } from "@/api/http";
import type { ReservaDto } from "@/api/viagens";
import { Button, IconButton } from "@/components";
import { Alert } from "@/components/display";
import { ConfirmModal, EmptyState, Skeleton, toast } from "@/components/feedback";
import { formatarData } from "@/lib/datas";
import { AnexarModal } from "./AnexarModal";
import s from "./Anexos.module.css";

interface ListaAnexosProps {
  viagemId: string;
  reservas: ReservaDto[];
  podeEnviar: boolean;
}

/** "reserva 1 · 212 KB · Guilherme" | "viagem · sensível · descarte 28/10/2026" (protótipo #s-viagem). */
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

export function ListaAnexos({ viagemId, reservas, podeEnviar }: ListaAnexosProps) {
  const qc = useQueryClient();
  const [anexando, setAnexando] = useState(false);
  const [excluindo, setExcluindo] = useState<AnexoDto>();

  const chave = chavesAnexos.daViagem(viagemId);
  const q = useQuery({ queryKey: chave, queryFn: () => anexosApi.daViagem(viagemId) });
  function invalidar() {
    void qc.invalidateQueries({ queryKey: chave });
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
        <EmptyState title="Nenhum anexo" description="Vouchers, comprovantes e contratos desta viagem ficam aqui." />
      )}
      {itens.map((a) => (
        <div key={a.id} className={s.item}>
          <div className={s.texto}>
            <b className={s.nome}>{a.nomeArquivo}</b>
            <span className={s.meta}>{descricaoAnexo(a, reservas)}</span>
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
          viagemId={viagemId}
          reservas={reservas}
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
          impact="O arquivo sai da viagem e deixa de ser acessível. Isso não pode ser desfeito."
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
