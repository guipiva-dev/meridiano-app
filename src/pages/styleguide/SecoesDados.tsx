import { type Coluna, DataTable, DateCell, KpiCard, MoneyCell, Paginacao, StatusCell } from "@/components";
import { EmptyState } from "@/components/feedback";
import { Section } from "@/components/shell";
import { FaixaResumo } from "@/components/viagem";
import s from "./StyleguidePage.module.css";

interface LinhaExemplo {
  id: string;
  titular: string;
  destino: string;
  codigo: string;
  ida: string;
  fase: string;
  venda: number;
  receita: number;
}

const LINHAS: LinhaExemplo[] = [
  {
    id: "1",
    titular: "Carlos Mendes",
    destino: "Lisboa",
    codigo: "VG-2026-0042",
    ida: "2026-04-18",
    fase: "em_emissao",
    venda: 17600,
    receita: 1600,
  },
  {
    id: "2",
    titular: "Lúcia Mendes",
    destino: "Cancún",
    codigo: "VG-2026-0041",
    ida: "2026-05-01",
    fase: "em_viagem",
    venda: 9200,
    receita: 820,
  },
  {
    id: "3",
    titular: "Rita Alves",
    destino: "Buenos Aires",
    codigo: "VG-2026-0038",
    ida: "2026-03-02",
    fase: "concluida",
    venda: 4300,
    receita: 390,
  },
];

const COLUNAS: Coluna<LinhaExemplo>[] = [
  {
    id: "viagem",
    titulo: "Viagem",
    render: (l) => (
      <div>
        <div>{l.titular}</div>
        <div>
          {l.destino} · <code>{l.codigo}</code>
        </div>
      </div>
    ),
  },
  { id: "ida", titulo: "Ida", ordenavel: true, render: (l) => <DateCell value={l.ida} /> },
  { id: "fase", titulo: "Fase", render: (l) => <StatusCell entidade="fase_viagem" valor={l.fase} /> },
  { id: "venda", titulo: "Venda", alinhar: "right", ordenavel: true, render: (l) => <MoneyCell value={l.venda} /> },
  {
    id: "receita",
    titulo: "Receita",
    alinhar: "right",
    render: (l) => <MoneyCell value={l.receita} emphasis="result" />,
  },
];

const chave = (l: LinhaExemplo) => l.id;

export function SecoesDados() {
  return (
    <>
      <div data-testid="sg-tabela">
        <Section title="Tabela" description="DataTable com linhas, carregando e vazio; paginação no rodapé">
          <DataTable
            legenda="Viagens de exemplo"
            colunas={COLUNAS}
            linhas={LINHAS}
            chave={chave}
            ordenacao={{ campo: "ida", direcao: "desc" }}
            onOrdenar={() => undefined}
            onLinha={() => undefined}
            rotuloLinha={(l) => `${l.titular} · ${l.destino} · ${l.codigo}`}
            rodape={<Paginacao pagina={1} tamanho={25} total={3} onPagina={() => undefined} />}
          />
          <DataTable legenda="Carregando" colunas={COLUNAS} linhas={[]} chave={chave} carregando />
          <DataTable
            legenda="Vazio"
            colunas={COLUNAS}
            linhas={[]}
            chave={chave}
            vazio={<EmptyState title="Nenhuma viagem por aqui" description="Nada bate com os filtros." />}
          />
        </Section>
      </div>

      <div data-testid="sg-kpi">
        <Section title="KPI" description="Informativo (só número e contexto) e acionável (com botão)">
          <div className={s.row}>
            <KpiCard label="Venda no mês" value="R$ 42.300,00" contexto="12 viagens" />
            <KpiCard label="Comissão a receber" value="R$ 3.180,00" contexto="4 reservas" tone="warning" />
            <KpiCard
              label="Comissão atrasada"
              value="R$ 1.240,00"
              contexto="2 reservas vencidas"
              tone="danger"
              actionLabel="Ver reservas"
              onAction={() => undefined}
            />
          </div>
        </Section>
      </div>

      <div data-testid="sg-faixa">
        <Section title="Faixa de resumo" description="Leitura do resultado da viagem (protótipo: summary-strip)">
          <FaixaResumo
            itens={[
              { label: "Venda ao cliente", value: 17600 },
              { label: "Custo fornecedores", value: 13000 },
              { label: "Receita prevista", value: 1600, tooltip: "Comissão + RAV + taxa de serviço" },
              { label: "Resultado", value: 1100, destaque: true },
            ]}
            extra={{ label: "Repasse", value: 500 }}
          />
        </Section>
      </div>
    </>
  );
}
