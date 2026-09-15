import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { useParams } from "react-router";
import { mensagemDeErro } from "@/api/http";
import {
  chaves,
  type ReservaDto,
  ROTULO_FORMA,
  ROTULO_SERVICO,
  type StatusReservaRequest,
  type ViagemDto,
  viagensApi,
} from "@/api/viagens";
import { Button, MoneyValue } from "@/components";
import { Alert, StatusBadge } from "@/components/display";
import { Skeleton } from "@/components/feedback";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { ListaServicos } from "@/components/servicos";
import { useOperacao } from "@/components/ViagemOperacoes/useOperacao";
import { cx } from "@/lib/cx";
import { formatarCarimbo, formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import { aplicarViagem } from "@/pages/viagens/detalhe/useViagem";
import r from "./Reserva.module.css";
import s from "./ReservaDetalhe.module.css";
import { ResultSummary } from "./ResultSummary";
import { deDto } from "./tipos";

interface ReservaDetalheCardProps {
  indice: number;
  reserva: ReservaDto;
  verValores: boolean;
  podeEditar: boolean;
  aberta: boolean;
  onToggle: () => void;
  onEditar: () => void;
  onRemarcar: () => void;
  onCancelar: () => void;
  onNfse: () => void;
  /** Ausente = sem ação (quem não vê valores ou não pode editar). Vale também para reserva cancelada. */
  onDuplicar?: () => void;
}

function Leitura({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className={s.item}>
      <span className={s.rotulo}>{rotulo}</span>
      <p className={s.valor}>{children}</p>
    </div>
  );
}

function HistoricoLista({ reservaId }: { reservaId: string }) {
  const q = useQuery({ queryKey: chaves.alteracoes(reservaId), queryFn: () => viagensApi.alteracoes(reservaId) });
  if (q.isPending) return <Skeleton lines={2} />;
  if (q.isError) return <Alert tone="danger">{mensagemDeErro(q.error)}</Alert>;
  const itens = q.data;
  if (itens.length === 0) return <span className={s.eventoMeta}>Sem alterações registradas.</span>;
  return (
    <div className={s.historico}>
      {itens.map((a) => (
        <div key={a.id} className={s.evento}>
          <span>
            {formatarData(a.dataAlteracao)} · {a.descricao}
          </span>
          {a.valorNovo !== null && a.valorNovo !== undefined && (
            <span className={s.eventoMeta}>
              {formatarDinheiro(a.valorAnterior)} → {formatarDinheiro(a.valorNovo)}
            </span>
          )}
          {a.multaCliente !== undefined && a.multaCliente > 0 && (
            <span className={s.eventoMeta}>multa {formatarDinheiro(a.multaCliente)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function Historico({ reservaId }: { reservaId: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <details
      className={s.historicoDetalhes}
      onToggle={(e) => {
        setAberto(e.currentTarget.open);
      }}
    >
      <summary>Histórico de alterações</summary>
      {aberto && <HistoricoLista reservaId={reservaId} />}
    </details>
  );
}

/** Card de reserva em leitura (detalhe da viagem). O `ReservationCard` continua sendo o do formulário. */
export function ReservaDetalheCard({
  indice,
  reserva,
  verValores,
  podeEditar,
  aberta,
  onToggle,
  onEditar,
  onRemarcar,
  onCancelar,
  onNfse,
  onDuplicar,
}: ReservaDetalheCardProps) {
  const idTitulo = useId();
  const idResultado = useId();
  const qc = useQueryClient();
  // "Marcar emitida" / "Voltar a em emissão" (§6.1). O card só recebe a reserva; a versão da viagem
  // (xmin exigido pelo PUT) vem do cache da rota `/viagens/:id`, e a resposta substitui a viagem em
  // cache como nas outras operações (`useViagem.aplicar`).
  const { id: viagemId = "" } = useParams();
  const status = useOperacao<StatusReservaRequest>((req) => viagensApi.definirStatusReserva(reserva.id, req), {});
  const [erroStatusLocal, setErroStatusLocal] = useState<string | null>(null);
  const cancelada = reserva.status === "cancelada";
  const emitida = reserva.status === "emitida";

  async function mudarStatus() {
    const viagem = qc.getQueryData<ViagemDto>(chaves.viagem(viagemId));
    if (!viagem) {
      setErroStatusLocal("Viagem não carregada. Recarregue a página e tente de novo.");
      return;
    }
    setErroStatusLocal(null);
    const dto = await status.enviar({ status: emitida ? "pendente" : "emitida", versao: viagem.versao });
    if (!dto) return;
    aplicarViagem(qc, viagemId, dto);
  }
  const servicos = reserva.tiposServico.map((t) => ROTULO_SERVICO[t]).join(" · ");
  const formas = reserva.formasPagamento.map((f) => ROTULO_FORMA[f]).join(" · ");

  const itensMenu: ItemMenu[] = [
    ...(podeEditar && !cancelada
      ? [
          { label: "Remarcar…", onClick: onRemarcar },
          { label: "NFSe…", onClick: onNfse },
        ]
      : []),
    ...(onDuplicar ? [{ label: "Duplicar", onClick: onDuplicar }] : []),
    ...(podeEditar && !cancelada ? [{ label: "Cancelar reserva…", onClick: onCancelar, tone: "danger" as const }] : []),
  ];

  return (
    <section aria-labelledby={idTitulo} className={cx(r.reserva, aberta && r.aberta, cancelada && r.cancelada)}>
      <header className={r.linha}>
        <span id={idTitulo} className={r.num} aria-label={`Reserva ${indice}`}>
          {indice}
        </span>
        <span className={r.quem}>
          <span className={r.fornecedor}>{reserva.fornecedorNome}</span>
          {servicos && <span className={r.servicos}>{servicos}</span>}
        </span>
        <span className={r.localizador}>{reserva.localizador}</span>
        <span className={r.status}>
          <StatusBadge entidade="reserva" valor={reserva.status} />
        </span>
        <span className={r.valores}>
          {verValores && (
            <>
              <span className={r.valor}>
                <MoneyValue value={reserva.valorCliente ?? null} />
              </span>
              <small className={r.receita}>receita {formatarDinheiro(reserva.receitaPrevista ?? 0)}</small>
            </>
          )}
        </span>
        <Button
          variant="tertiary"
          size="sm"
          aria-expanded={aberta}
          icon={<ChevronDown size={16} className={cx(r.chevron, aberta && r.chevronAberto)} />}
          onClick={onToggle}
        >
          {aberta ? "Recolher" : "Expandir"}
        </Button>
      </header>

      {aberta && (
        <div className={r.corpo}>
          <div className={s.grid}>
            <Leitura rotulo="Data da compra">{formatarData(reserva.dataCompra)}</Leitura>
            <Leitura rotulo="NFSe">
              <StatusBadge entidade="nfse" valor={reserva.nfseStatus} />
              {reserva.nfseNumero && <span className={s.mono}>{reserva.nfseNumero}</span>}
              {reserva.nfseStatus === "emitido" && reserva.nfseDataEmissao && (
                <span>emitida em {formatarData(reserva.nfseDataEmissao)}</span>
              )}
            </Leitura>
            <Leitura rotulo="Formas de pagamento">{formas || "—"}</Leitura>
            <Leitura rotulo="Previsão da comissão">{formatarData(reserva.dataPrevistaComissao)}</Leitura>
            <Leitura rotulo="Situação">
              <StatusBadge entidade="comissao" valor={reserva.situacaoComissao} />
            </Leitura>
          </div>

          {verValores && (
            <div className={s.secao} role="group" aria-labelledby={idResultado}>
              <span id={idResultado} className={s.rotulo}>
                Resultado desta reserva
              </span>
              <ResultSummary value={deDto(reserva)} />
            </div>
          )}

          {cancelada && (
            <div className={s.cancelamento}>
              <b>Cancelamento</b>
              <span className={s.cancelamentoLinha}>
                {formatarCarimbo(reserva.canceladaEm)} · {reserva.motivoCancelamento ?? "sem motivo registrado"}
              </span>
              <span className={s.cancelamentoLinha}>
                {reserva.desfechoCancelamento && (
                  <StatusBadge entidade="desfecho" valor={reserva.desfechoCancelamento} />
                )}
                {verValores && reserva.valorReembolso !== null && reserva.valorReembolso !== undefined && (
                  <span>{formatarDinheiro(reserva.valorReembolso)}</span>
                )}
                {reserva.comissaoMantida && <span>comissão mantida</span>}
              </span>
            </div>
          )}

          <div className={s.secao}>
            <span className={s.rotulo}>Serviços</span>
            <ListaServicos reserva={reserva} podeEditar={podeEditar && !cancelada} />
          </div>

          <Historico reservaId={reserva.id} />

          {podeEditar && !cancelada && (
            <>
              {status.conflito && (
                <Alert tone="danger">
                  Alguém alterou esta viagem enquanto você decidia. Recarregue e tente de novo.
                </Alert>
              )}
              {(erroStatusLocal ?? status.erroBloco) && (
                <Alert tone="danger">{erroStatusLocal ?? status.erroBloco}</Alert>
              )}
            </>
          )}

          {((podeEditar && !cancelada) || itensMenu.length > 0) && (
            <div className={s.acoes}>
              {podeEditar && !cancelada && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={status.salvando}
                    onClick={() => {
                      void mudarStatus();
                    }}
                  >
                    {emitida ? "Voltar a em emissão" : "Marcar emitida"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onEditar}>
                    Editar
                  </Button>
                </>
              )}
              <MenuAcoes label="Mais ações da reserva" itens={itensMenu} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
