import type { ViagemDto } from "@/api/viagens";
import { MoneyValue } from "@/components";
import { StatusBadge } from "@/components/display";
import { FaixaResumo, type ItemFaixa } from "@/components/viagem";
import { formatarData } from "@/lib/datas";
import { Bloco } from "./ResumoTab";
import s from "./Viagem.module.css";

/** Leitura apenas: movimentos e despesas entram na fase 3.5. */
export function FinanceiroTab({ viagem }: { viagem: ViagemDto }) {
  const r = viagem.resumo;
  const itens: ItemFaixa[] = r
    ? [
        { label: "Receita prevista", value: r.receitaPrevista },
        { label: "Comissões recebidas", value: r.receitaRecebida },
        {
          label: "Comissão da vendedora",
          value: r.repasseValor,
          badge: r.repasseStatus ? <StatusBadge entidade="repasse" valor={r.repasseStatus} /> : undefined,
        },
        { label: "Despesas", value: r.despesasViagem },
        { label: "Resultado", value: r.resultado, destaque: true },
      ]
    : [];
  const aReceber = viagem.reservas.filter((res) => res.status !== "cancelada" && (res.valorEsperadoOperadora ?? 0) > 0);

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
              <span className={s.linhaMeta}>previsto para {formatarData(res.dataPrevistaComissao)}</span>
            </span>
            <StatusBadge entidade="comissao" valor={res.situacaoComissao} />
            <MoneyValue value={res.valorEsperadoOperadora ?? null} className={s.linhaValor} />
          </div>
        ))}
      </Bloco>
    </div>
  );
}
