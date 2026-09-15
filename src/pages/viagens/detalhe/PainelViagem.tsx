import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import type { PendenciaDto } from "@/api/pendencias";
import type { ReservaDto, ViagemDto } from "@/api/viagens";
import { Button, MoneyValue } from "@/components";
import { Badge, StatusBadge, Tooltip } from "@/components/display";
import { comissaoMedia, rotuloComissaoMedia } from "@/components/viagem";
import { formatarData } from "@/lib/datas";
import { formatarCpf } from "@/lib/documentos";
import { TOOLTIP_RECEBIDA } from "./Bloco";
import s from "./PainelViagem.module.css";

const TOOLTIP_RESULTADO = "Receita da agência − comissão do vendedor − despesas vinculadas";

function Kpi({
  rotulo,
  tooltip,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  tooltip?: string;
  valor: number | null;
  nota?: ReactNode;
  destaque?: boolean;
}) {
  return (
    <div className={destaque ? `${s.kpi} ${s.destaque}` : s.kpi}>
      <dt>
        {rotulo}
        {tooltip && (
          <Tooltip text={tooltip}>
            <CircleHelp size={16} aria-hidden />
          </Tooltip>
        )}
      </dt>
      <dd>
        <MoneyValue value={valor} emphasis={destaque ? "result" : undefined} />
        {nota}
      </dd>
    </div>
  );
}

function BlocoViagem({ viagem, verValores }: { viagem: ViagemDto; verValores: boolean }) {
  const r = viagem.resumo;
  if (r) {
    const media = comissaoMedia(viagem.reservas);
    return (
      <dl className={s.kpis}>
        <Kpi rotulo="Total cobrado" valor={r.vendaTotal} />
        <Kpi rotulo="Custo das reservas" valor={r.custoFornecedores} />
        <Kpi
          rotulo="Receita da agência"
          valor={r.receitaPrevista}
          nota={media === null ? undefined : <small className={s.nota}>{rotuloComissaoMedia(media)}</small>}
        />
        <Kpi
          rotulo="Comissão do vendedor"
          valor={r.repasseValor}
          nota={r.repasseStatus ? <StatusBadge entidade="repasse" valor={r.repasseStatus} /> : undefined}
        />
        <Kpi rotulo="Despesas da viagem" valor={r.despesasViagem} />
        <Kpi rotulo="Resultado da viagem" tooltip={TOOLTIP_RESULTADO} valor={r.resultado} destaque />
        <Kpi rotulo="Receita recebida" tooltip={TOOLTIP_RECEBIDA} valor={r.receitaRecebida} />
      </dl>
    );
  }
  if (verValores) {
    const ativas = viagem.reservas.filter((x) => x.status !== "cancelada");
    const soma = (campo: (res: ReservaDto) => number | undefined) =>
      ativas.reduce((t, res) => t + (campo(res) ?? 0), 0);
    return (
      <dl className={s.kpis}>
        <Kpi rotulo="Total cobrado" valor={soma((res) => res.valorCliente)} />
        <Kpi rotulo="Custo das reservas" valor={soma((res) => res.valorTotal)} />
        <Kpi rotulo="Receita da agência" valor={soma((res) => res.receitaPrevista)} destaque />
      </dl>
    );
  }
  if (viagem.repasse) {
    return (
      <dl className={s.kpis}>
        <Kpi
          rotulo="Seu repasse"
          valor={viagem.repasse.valor}
          nota={<StatusBadge entidade="repasse" valor={viagem.repasse.status} />}
        />
      </dl>
    );
  }
  return null;
}

export function PainelViagem({
  viagem,
  verValores,
  pendencias,
  onVerPendencias,
}: {
  viagem: ViagemDto;
  verValores: boolean;
  pendencias: PendenciaDto[];
  onVerPendencias: () => void;
}) {
  const proximas = pendencias
    .filter((p) => p.status === "aberta")
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))
    .slice(0, 2);
  const temNumeros = Boolean(viagem.resumo) || verValores || Boolean(viagem.repasse);
  return (
    <aside aria-label="Resumo da viagem" className={s.painel}>
      {temNumeros && (
        <section className={s.bloco}>
          <h2 className={s.titulo}>Viagem</h2>
          <BlocoViagem viagem={viagem} verValores={verValores} />
        </section>
      )}
      <section className={s.bloco}>
        <h2 className={s.titulo}>Passageiros · {viagem.passageiros.length}</h2>
        <ul className={s.lista}>
          {viagem.passageiros.map((p) => {
            const meta = [p.cpf && formatarCpf(p.cpf), p.dataNascimento && `nasc. ${formatarData(p.dataNascimento)}`]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={p.clienteId} className={s.item}>
                <span className={s.itemTexto}>
                  <span className={s.itemTitulo}>{p.nome}</span>
                  {meta && <span className={s.itemMeta}>{meta}</span>}
                </span>
                {p.titular && <Badge tone="neutral">Titular</Badge>}
              </li>
            );
          })}
        </ul>
      </section>
      <section className={s.bloco}>
        <h2 className={s.titulo}>Próximas pendências</h2>
        {proximas.length === 0 ? (
          <p className={s.nota}>Nenhuma pendência aberta nesta viagem.</p>
        ) : (
          <ul className={s.lista}>
            {proximas.map((p) => (
              <li key={p.id} className={s.item}>
                <span className={s.itemTexto}>
                  <span className={s.itemTitulo}>{p.clienteNome ? `${p.titulo} — ${p.clienteNome}` : p.titulo}</span>
                  <span className={s.itemMeta}>
                    até {formatarData(p.dataPrevista)} · {p.origem === "automatica" ? "automática" : "manual"}
                    {p.responsavelNome ? ` · ${p.responsavelNome}` : ""}
                  </span>
                </span>
                {p.prioridade === "urgente" && <StatusBadge entidade="prioridade" valor="urgente" />}
              </li>
            ))}
          </ul>
        )}
        <Button variant="tertiary" size="sm" onClick={onVerPendencias}>
          Ver todas
        </Button>
      </section>
    </aside>
  );
}
