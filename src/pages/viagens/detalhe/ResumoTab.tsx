import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { chavesPendencias, pendenciasApi } from "@/api/pendencias";
import { type ReservaDto, ROTULO_SERVICO, type ViagemDto } from "@/api/viagens";
import { Button, MoneyValue } from "@/components";
import { Badge, StatusBadge } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { FaixaResumo, type ItemFaixa } from "@/components/viagem";
import { formatarData } from "@/lib/datas";
import s from "./Viagem.module.css";

const TOOLTIP_RESULTADO = "Receita das reservas − comissão da vendedora − despesas vinculadas";

export function Bloco({ titulo, meta, children }: { titulo: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.bloco}>
      <header className={s.blocoTopo}>
        <h2 className={s.blocoTitulo}>{titulo}</h2>
        {meta && <span className={s.blocoMeta}>{meta}</span>}
      </header>
      {children}
    </section>
  );
}

/** Faixa completa com `resumo`; sem `viagem.ver_resultado`, a versão reduzida das reservas. */
function faixaDaViagem(
  viagem: ViagemDto,
  verValores: boolean,
): { itens: ItemFaixa[]; extra?: { label: string; value: number } } | null {
  const r = viagem.resumo;
  if (r) {
    return {
      itens: [
        { label: "Venda total", value: r.vendaTotal },
        { label: "Custo dos fornecedores", value: r.custoFornecedores },
        {
          label: "Comissão da vendedora",
          value: r.repasseValor,
          badge: r.repasseStatus ? <StatusBadge entidade="repasse" valor={r.repasseStatus} /> : undefined,
        },
        { label: "Despesas da viagem", value: r.despesasViagem },
        { label: "Resultado da viagem", value: r.resultado, destaque: true, tooltip: TOOLTIP_RESULTADO },
      ],
      extra: { label: "Comissões recebidas", value: r.receitaRecebida },
    };
  }
  if (!verValores) return null;
  const ativas = viagem.reservas.filter((x) => x.status !== "cancelada");
  const soma = (campo: (res: ReservaDto) => number | undefined) =>
    ativas.reduce((total, res) => total + (campo(res) ?? 0), 0);
  return {
    itens: [
      { label: "Venda total", value: soma((res) => res.valorCliente) },
      { label: "Custo dos fornecedores", value: soma((res) => res.valorTotal) },
      { label: "Receita da agência", value: soma((res) => res.receitaPrevista), destaque: true },
    ],
  };
}

interface ResumoTabProps {
  viagem: ViagemDto;
  verValores: boolean;
  onAbrirReserva: (reservaId: string) => void;
  onVerPendencias: () => void;
}

export function ResumoTab({ viagem, verValores, onAbrirReserva, onVerPendencias }: ResumoTabProps) {
  const faixa = faixaDaViagem(viagem, verValores);
  const pendenciasQ = useQuery({
    queryKey: chavesPendencias.daViagem(viagem.id, false),
    queryFn: () => pendenciasApi.daViagem(viagem.id, false),
  });
  const proximas = [...(pendenciasQ.data ?? [])]
    .filter((p) => p.status === "aberta")
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
    .slice(0, 2);

  return (
    <div className={s.resumo}>
      {faixa && <FaixaResumo itens={faixa.itens} extra={faixa.extra} />}

      <div className={s.split}>
        <Bloco titulo="Reservas" meta={`${viagem.reservas.length} · clique para abrir`}>
          {viagem.reservas.length === 0 && (
            <EmptyState title="Nenhuma reserva" description="Adicione a primeira reserva pela edição da viagem." />
          )}
          {viagem.reservas.map((res, i) => (
            <button
              key={res.id}
              type="button"
              className={s.linhaClicavel}
              onClick={() => {
                onAbrirReserva(res.id);
              }}
            >
              <span className={s.numero}>{i + 1}</span>
              <span className={s.linhaTexto}>
                <b className={s.linhaTitulo}>
                  {res.fornecedorNome}
                  {res.localizador && <code className={s.codigo}> · {res.localizador}</code>}
                </b>
                <span className={s.linhaMeta}>{res.tiposServico.map((t) => ROTULO_SERVICO[t]).join(" · ")}</span>
              </span>
              <StatusBadge entidade="reserva" valor={res.status} />
              {verValores && <MoneyValue value={res.valorCliente ?? null} className={s.linhaValor} />}
            </button>
          ))}
        </Bloco>

        <Bloco titulo="Passageiros" meta={viagem.passageiros.length}>
          {viagem.passageiros.map((p) => (
            <div key={p.clienteId} className={s.linha}>
              <span className={s.linhaTitulo}>{p.nome}</span>
              {p.titular && <Badge tone="neutral">titular</Badge>}
            </div>
          ))}
        </Bloco>
      </div>

      <Bloco titulo="Próximas pendências" meta="as 2 mais próximas">
        {proximas.length === 0 && <p className={s.vazio}>Nenhuma pendência aberta nesta viagem.</p>}
        {proximas.map((p) => (
          <div key={p.id} className={s.linha}>
            <span className={s.linhaTexto}>
              <b className={s.linhaTitulo}>{p.clienteNome ? `${p.titulo} — ${p.clienteNome}` : p.titulo}</b>
              <span className={s.linhaMeta}>
                até {formatarData(p.dataPrevista)} · {p.origem === "automatica" ? "automática" : "manual"}
                {p.responsavelNome ? ` · ${p.responsavelNome}` : ""}
              </span>
            </span>
            {p.prioridade === "urgente" && <StatusBadge entidade="prioridade" valor="urgente" />}
          </div>
        ))}
        <Button variant="tertiary" size="sm" onClick={onVerPendencias}>
          Ver todas na aba Pendências
        </Button>
      </Bloco>
    </div>
  );
}
