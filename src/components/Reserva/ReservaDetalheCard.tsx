import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useId, useState } from "react";
import { useParams } from "react-router";
import { chavesAuditoria } from "@/api/auditoria";
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
import { chaveDasPendencias } from "@/components/Pendencias/chave";
import { ListaServicos } from "@/components/servicos";
import { useOperacao } from "@/components/ViagemOperacoes/useOperacao";
import { formatarCarimbo, formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
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
}

const ROTULO_FLUXO = {
  cliente_paga_operadora: "Cliente paga a operadora",
  cliente_paga_agencia: "Cliente paga a agência",
};

function Leitura({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className={s.item}>
      <span className={s.rotulo}>{rotulo}</span>
      <p className={s.valor}>{children}</p>
    </div>
  );
}

function Historico({ reservaId }: { reservaId: string }) {
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
}: ReservaDetalheCardProps) {
  const idTitulo = useId();
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
    // Mesmo conjunto que `useViagem.aplicar` derruba (fonte da lista): manter os dois em sincronia.
    qc.setQueryData(chaves.viagem(viagemId), dto);
    void qc.invalidateQueries({ queryKey: ["viagens", "lista"] });
    void qc.invalidateQueries({ queryKey: chaveDasPendencias(viagemId) });
    void qc.invalidateQueries({ queryKey: chavesAuditoria.daViagem(viagemId) });
    void qc.invalidateQueries({ queryKey: chaves.creditos(viagemId) });
    void qc.invalidateQueries({ queryKey: ["reservas"] });
  }
  const servicos = reserva.tiposServico.map((t) => ROTULO_SERVICO[t]).join(" · ");
  const formas = reserva.formasPagamento.map((f) => ROTULO_FORMA[f]).join(" · ");

  return (
    <section aria-labelledby={idTitulo} className={r.card}>
      <header className={r.header}>
        <span id={idTitulo} className={r.numId}>
          Reserva {indice}
        </span>
        <span className={r.fornecedor}>{reserva.fornecedorNome}</span>
        {reserva.localizador && <span className={r.localizador}>{reserva.localizador}</span>}
        <StatusBadge entidade="reserva" valor={reserva.status} />
        {servicos && <span className={r.servicos}>{servicos}</span>}
        {verValores && (
          <span className={r.total}>
            <MoneyValue value={reserva.valorCliente ?? null} />
            <small className={r.receitaSmall}>receita {formatarDinheiro(reserva.receitaPrevista ?? 0)}</small>
          </span>
        )}
        <Button variant="tertiary" size="sm" aria-expanded={aberta} onClick={onToggle}>
          {aberta ? "Recolher" : "Expandir"}
        </Button>
      </header>

      {aberta && (
        <div className={r.body}>
          <div className={s.grid}>
            <Leitura rotulo="Data da compra">{formatarData(reserva.dataCompra)}</Leitura>
            <Leitura rotulo="NFSe">
              <StatusBadge entidade="nfse" valor={reserva.nfseStatus} />
              {reserva.nfseNumero && <span className={s.mono}>{reserva.nfseNumero}</span>}
            </Leitura>
            <Leitura rotulo="Formas de pagamento">{formas || "—"}</Leitura>
            <Leitura rotulo="Fluxo">{ROTULO_FLUXO[reserva.fluxoPagamento]}</Leitura>
            <Leitura rotulo="Previsão da comissão">{formatarData(reserva.dataPrevistaComissao)}</Leitura>
            <Leitura rotulo="Situação">
              <StatusBadge entidade="comissao" valor={reserva.situacaoComissao} />
            </Leitura>
          </div>

          {verValores && (
            <div className={r.group}>
              <div className={r.eyebrow}>Resultado desta reserva</div>
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

          <div className={r.group}>
            <div className={r.eyebrow}>Serviços</div>
            <ListaServicos reserva={reserva} podeEditar={podeEditar && !cancelada} />
          </div>

          <div className={r.group}>
            <div className={r.eyebrow}>Histórico de alterações</div>
            <Historico reservaId={reserva.id} />
          </div>

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
              <div className={s.acoes}>
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
                <Button variant="secondary" size="sm" onClick={onRemarcar}>
                  Remarcar…
                </Button>
                <Button variant="secondary" size="sm" onClick={onNfse}>
                  NFSe…
                </Button>
                <Button variant="danger" size="sm" onClick={onCancelar}>
                  Cancelar reserva…
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
