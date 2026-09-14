import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { chavesDespesas } from "@/api/despesas";
import { chavesFinanceiro } from "@/api/financeiro";
import { chaves, type ReservaDto, type SituacaoComissao, type ViagemDto } from "@/api/viagens";
import { useAuth } from "@/auth/useAuth";
import { Button, MoneyValue } from "@/components";
import { StatusBadge } from "@/components/display";
import { type ItemRecebimento, ReceberModal } from "@/components/financeiro";
import { FaixaResumo, type ItemFaixa } from "@/components/viagem";
import { formatarData } from "@/lib/datas";
import { formatarDinheiro } from "@/lib/dinheiro";
import { DespesasViagem } from "./DespesasViagem";
import { MovimentosViagem } from "./MovimentosViagem";
import { Bloco, TOOLTIP_RECEBIDA } from "./ResumoTab";
import s from "./Viagem.module.css";

/** Financeiro da viagem (R10): faixa de resumo, atalho de recebimento, movimentos de caixa e
 * despesas ligadas. `aplicar()` derruba o que a view do resumo/conciliação/repasse recalcula. */
export function FinanceiroTab({ viagem }: { viagem: ViagemDto }) {
  const { pode } = useAuth();
  const qc = useQueryClient();
  const [recebendo, setRecebendo] = useState<ReservaDto | undefined>();
  const podeMovimentar = pode("financeiro.movimentar");
  const verValores = viagem.reservas[0]?.valorTotal !== undefined;

  const r = viagem.resumo;
  const itens: ItemFaixa[] = r
    ? [
        { label: "Receita da agência", value: r.receitaPrevista },
        { label: "Receita recebida", value: r.receitaRecebida, tooltip: TOOLTIP_RECEBIDA },
        {
          label: "Comissão do vendedor",
          value: r.repasseValor,
          badge: r.repasseStatus ? <StatusBadge entidade="repasse" valor={r.repasseStatus} /> : undefined,
        },
        { label: "Despesas da viagem", value: r.despesasViagem },
        { label: "Resultado da viagem", value: r.resultado, destaque: true },
      ]
    : [];
  // A07/A38: "divergente" é conciliada (spec §6.1) — junto com "recebida" vai para "Comissões
  // recebidas", sem botão Receber.
  const SITUACOES_A_RECEBER: SituacaoComissao[] = ["a_receber", "parcial", "atrasada"];
  const comValorEsperado = viagem.reservas.filter(
    (res) => res.status !== "cancelada" && (res.valorEsperadoOperadora ?? 0) > 0,
  );
  const aReceber = comValorEsperado.filter((res) => SITUACOES_A_RECEBER.includes(res.situacaoComissao));
  const recebidas = comValorEsperado.filter((res) => !SITUACOES_A_RECEBER.includes(res.situacaoComissao));

  function aplicar() {
    void qc.invalidateQueries({ queryKey: chaves.viagem(viagem.id) });
    void qc.invalidateQueries({ queryKey: chavesFinanceiro.movimentosDaViagem(viagem.id) });
    void qc.invalidateQueries({ queryKey: chavesDespesas.daViagem(viagem.id) });
    void qc.invalidateQueries({ queryKey: ["conciliacao"] });
    void qc.invalidateQueries({ queryKey: ["repasses"] });
  }

  const itemRecebimento: ItemRecebimento | undefined = recebendo
    ? {
        reservaId: recebendo.id,
        fornecedorNome: recebendo.fornecedorNome,
        localizador: recebendo.localizador,
        esperado: recebendo.valorEsperadoOperadora ?? 0,
        recebido: recebendo.recebidoOperadora ?? 0,
        saldo: (recebendo.valorEsperadoOperadora ?? 0) - (recebendo.recebidoOperadora ?? 0),
      }
    : undefined;

  return (
    <div className={s.resumo}>
      {itens.length > 0 && <FaixaResumo itens={itens} />}
      <Bloco titulo="Comissões a receber" meta={aReceber.length}>
        {aReceber.length === 0 && <p className={s.vazio}>Nenhuma comissão prevista nesta viagem.</p>}
        {aReceber.map((res) => (
          <div key={res.id} className={s.linha}>
            <span className={s.linhaTexto}>
              <b className={s.linhaTitulo}>
                {res.fornecedorNome}
                {res.localizador && <code className={s.codigo}> · {res.localizador}</code>}
              </b>
              <span className={s.linhaMeta}>
                {res.situacaoComissao === "parcial"
                  ? `recebido ${formatarDinheiro(res.recebidoOperadora ?? 0)} · falta ${formatarDinheiro(
                      (res.valorEsperadoOperadora ?? 0) - (res.recebidoOperadora ?? 0),
                    )}`
                  : `previsto para ${formatarData(res.dataPrevistaComissao)}`}
              </span>
            </span>
            <StatusBadge entidade="comissao" valor={res.situacaoComissao} />
            <MoneyValue value={res.valorEsperadoOperadora ?? null} className={s.linhaValor} />
            {podeMovimentar && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRecebendo(res);
                }}
              >
                Receber
              </Button>
            )}
          </div>
        ))}
      </Bloco>

      {recebidas.length > 0 && (
        <Bloco titulo="Comissões recebidas" meta={recebidas.length}>
          {recebidas.map((res) => (
            <div key={res.id} className={s.linha}>
              <span className={s.linhaTexto}>
                <b className={s.linhaTitulo}>
                  {res.fornecedorNome}
                  {res.localizador && <code className={s.codigo}> · {res.localizador}</code>}
                </b>
              </span>
              <StatusBadge entidade="comissao" valor={res.situacaoComissao} />
              <MoneyValue value={res.valorEsperadoOperadora ?? null} className={s.linhaValor} />
            </div>
          ))}
        </Bloco>
      )}

      <MovimentosViagem viagem={viagem} podeMovimentar={podeMovimentar} verValores={verValores} onMudou={aplicar} />
      <DespesasViagem viagem={viagem} podeMovimentar={podeMovimentar} onMudou={aplicar} />

      {itemRecebimento && (
        <ReceberModal
          open
          item={itemRecebimento}
          onClose={() => {
            setRecebendo(undefined);
          }}
          onRecebido={() => {
            setRecebendo(undefined);
            aplicar();
          }}
        />
      )}
    </div>
  );
}
