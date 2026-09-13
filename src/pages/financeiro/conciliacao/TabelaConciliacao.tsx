import { useNavigate } from "react-router";
import type { AbaConciliacao, ConciliacaoItemDto } from "@/api/financeiro";
import { Button, Checkbox, type Coluna, DataTable, DateCell, MoneyCell, StatusCell } from "@/components";
import { Badge } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { formatarDinheiro } from "@/lib/dinheiro";
import s from "./Conciliacao.module.css";

interface TabelaConciliacaoProps {
  itens: ConciliacaoItemDto[];
  aba: AbaConciliacao;
  carregando?: boolean;
  selecionados: ReadonlySet<string>;
  alternar: (reservaId: string) => void;
  alternarTodas: (idsElegiveis: string[]) => void;
  podeMovimentar: boolean;
  podeConciliar: boolean;
  onReceber: (i: ConciliacaoItemDto) => void;
  onDivergencia: (i: ConciliacaoItemDto) => void;
}

/** Só pendentes/atrasadas têm lote: recebidas já entraram e divergências saíram da conciliação. */
function abaComLote(aba: AbaConciliacao) {
  return aba === "pendentes" || aba === "atrasadas";
}

export function TabelaConciliacao({
  itens,
  aba,
  carregando,
  selecionados,
  alternar,
  alternarTodas,
  podeMovimentar,
  podeConciliar,
  onReceber,
  onDivergencia,
}: TabelaConciliacaoProps) {
  const nav = useNavigate();
  const comSelecao = podeConciliar && abaComLote(aba);
  const recebidas = aba === "recebidas";
  const divergencias = aba === "divergencias";

  function menu(i: ConciliacaoItemDto): ItemMenu[] {
    const itensMenu: ItemMenu[] = [];
    // Divergência é para o que já deveria ter entrado: parcial (recebido > 0) ou vencida.
    // Em divergências o encerramento (estorno pendente) já é botão visível na linha.
    if (
      podeConciliar &&
      !divergencias &&
      !i.conciliacaoEncerrada &&
      (i.recebido > 0 || i.situacaoComissao === "atrasada")
    ) {
      itensMenu.push({
        label: "Encerrar divergência…",
        onClick: () => {
          onDivergencia(i);
        },
      });
    }
    // Em divergências a linha inteira já leva à viagem; um menu ali só duplicaria o destino e o
    // clique no "⋯" nem chegaria a abrir (a linha navega primeiro).
    if (!divergencias) {
      itensMenu.push({
        label: "Ver viagem",
        onClick: () => {
          void nav(`/viagens/${i.viagemId}?reserva=${i.reservaId}`);
        },
      });
    }
    return itensMenu;
  }

  const colunas: Coluna<ConciliacaoItemDto>[] = [];
  if (comSelecao) {
    const idsElegiveis = itens.filter((i) => i.elegivelLote).map((i) => i.reservaId);
    const todasLigadas = idsElegiveis.length > 0 && idsElegiveis.every((id) => selecionados.has(id));
    colunas.push({
      id: "sel",
      titulo: (
        <Checkbox
          label=""
          aria-label="Selecionar todas elegíveis"
          checked={todasLigadas}
          onChange={() => {
            alternarTodas(idsElegiveis);
          }}
        />
      ),
      largura: "40px",
      render: (i) =>
        i.elegivelLote && (
          <Checkbox
            label=""
            aria-label={`Selecionar ${i.localizador ?? i.codigo}`}
            checked={selecionados.has(i.reservaId)}
            onChange={() => {
              alternar(i.reservaId);
            }}
          />
        ),
    });
  }
  colunas.push(
    {
      id: "reserva",
      titulo: "Reserva",
      render: (i) => (
        <div>
          <div className={s.primary}>
            {i.titular ?? "Sem titular"} · {i.destino}
          </div>
          <div className={s.secondary}>
            <code>{i.codigo}</code>
            {i.localizador && (
              <>
                {" · "}
                <code>{i.localizador}</code>
              </>
            )}
          </div>
        </div>
      ),
    },
    { id: "operadora", titulo: "Operadora", render: (i) => i.fornecedorNome },
    {
      id: "previsto",
      titulo: recebidas ? "Recebido em" : "Previsto",
      render: (i) => <DateCell value={recebidas ? i.ultimoRecebimentoEm : i.dataPrevistaComissao} />,
    },
    divergencias
      ? {
          id: "motivo",
          titulo: "Motivo",
          // ALT-01: estorno pendente ainda não tem motivo — a situação diz o que falta.
          render: (i) =>
            i.situacaoComissao === "estorno_pendente" ? (
              <StatusCell entidade="comissao" valor={i.situacaoComissao} />
            ) : (
              (i.divergenciaMotivo ?? "—")
            ),
        }
      : {
          id: "situacao",
          titulo: "Situação",
          render: (i) => {
            // A46: recebido além do esperado (estorno de operadora, p.ex.) não é mais uma divergência
            // silenciosa — o mesmo estilo de aviso da divergência, mas com o quanto passou.
            if (recebidas && i.recebido > i.esperado) {
              return <Badge tone="warning">Recebida · +{formatarDinheiro(i.recebido - i.esperado)} acima</Badge>;
            }
            return i.diasAtraso !== null && i.diasAtraso > 0 ? (
              <Badge tone="danger">{i.diasAtraso} dias de atraso</Badge>
            ) : (
              <StatusCell entidade="comissao" valor={i.situacaoComissao} />
            );
          },
        },
    { id: "esperado", titulo: "Esperado", alinhar: "right", render: (i) => <MoneyCell value={i.esperado} /> },
    { id: "recebido", titulo: "Recebido", alinhar: "right", render: (i) => <MoneyCell value={i.recebido} /> },
    {
      id: "acoes",
      titulo: "",
      alinhar: "right",
      render: (i) => (
        <div className={s.acoes}>
          {podeMovimentar && !recebidas && !divergencias && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onReceber(i);
              }}
            >
              {i.recebido > 0 ? "Receber saldo" : "Receber"}
            </Button>
          )}
          {/* X02: linha parcial (já recebeu algo) ganha a ação de encerrar divergência visível, ao
              lado de "Receber saldo" — some no kebab só quem precisa procurar. */}
          {podeConciliar && !i.conciliacaoEncerrada && !recebidas && !divergencias && i.recebido > 0 && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                onDivergencia(i);
              }}
            >
              Encerrar divergência…
            </Button>
          )}
          {/* ALT-01: estorno pendente em divergências. A linha navega no clique/Enter; o botão não propaga. */}
          {podeConciliar && divergencias && !i.conciliacaoEncerrada && i.situacaoComissao === "estorno_pendente" && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDivergencia(i);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
            >
              Encerrar divergência…
            </Button>
          )}
          <MenuAcoes label={`Mais ações de ${i.localizador ?? i.codigo}`} itens={menu(i)} />
        </div>
      ),
    },
  );

  return (
    <DataTable
      legenda={recebidas ? "Comissões recebidas" : divergencias ? "Divergências" : "Comissões a receber"}
      colunas={colunas}
      linhas={itens}
      chave={(i) => i.reservaId}
      carregando={carregando}
      rotuloLinha={(i) => `${i.titular ?? "Sem titular"} · ${i.destino} · ${i.codigo}`}
      onLinha={
        divergencias
          ? (i) => {
              void nav(`/viagens/${i.viagemId}?reserva=${i.reservaId}`);
            }
          : undefined
      }
      vazio={
        <EmptyState
          title="Nada pendente"
          description="Todas as comissões previstas já entraram. Novas reservas aparecem aqui quando lançadas."
        />
      }
    />
  );
}
