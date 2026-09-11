import { Link } from "react-router";
import type { CategoriaDespesa, DespesaDto, SituacaoDespesa } from "@/api/despesas";
import { CATEGORIAS_DESPESA } from "@/api/despesas";
import { Button, type Coluna, DataTable, DateCell, MoneyCell, Select, StatusCell } from "@/components";
import { Badge } from "@/components/display";
import { EmptyState } from "@/components/feedback";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarData, nomeMes } from "@/lib/datas";
import s from "./Despesas.module.css";
import type { FiltroDespesasPatch } from "./useDespesas";

const OPCOES_CATEGORIA = CATEGORIAS_DESPESA.map((c) => ({
  value: c,
  label: apresentacaoStatus("despesa_categoria", c).texto,
}));
const OPCOES_SITUACAO: { value: SituacaoDespesa; label: string }[] = [
  { value: "a_pagar", label: "A pagar" },
  { value: "vencida", label: "Vencida" },
  { value: "paga", label: "Paga" },
];

interface FiltrosDespesasProps {
  categoria?: CategoriaDespesa;
  situacao?: SituacaoDespesa;
  soVinculadas?: boolean;
  definir: (patch: FiltroDespesasPatch) => void;
}

export function FiltrosDespesas({ categoria, situacao, soVinculadas, definir }: FiltrosDespesasProps) {
  return (
    <div className={s.filtros}>
      <Select
        aria-label="Categoria"
        placeholder="Categoria: todas"
        options={OPCOES_CATEGORIA}
        value={categoria ?? ""}
        onChange={(e) => {
          definir({ categoria: (e.target.value || undefined) as CategoriaDespesa | undefined });
        }}
      />
      <Select
        aria-label="Situação"
        placeholder="Situação: todas"
        options={OPCOES_SITUACAO}
        value={situacao ?? ""}
        onChange={(e) => {
          definir({ situacao: (e.target.value || undefined) as SituacaoDespesa | undefined });
        }}
      />
      <Select
        aria-label="Viagem"
        placeholder="Viagem: qualquer"
        options={[{ value: "so", label: "Só ligadas a viagem" }]}
        value={soVinculadas ? "so" : ""}
        onChange={(e) => {
          definir({ soVinculadas: e.target.value === "so" || undefined });
        }}
      />
    </div>
  );
}

interface TabelaDespesasProps {
  itens: DespesaDto[];
  carregando?: boolean;
  podeMovimentar: boolean;
  mes: string;
  onPagar: (d: DespesaDto) => void;
  onEditar: (d: DespesaDto) => void;
  onExcluir: (d: DespesaDto) => void;
}

export function TabelaDespesas({
  itens,
  carregando,
  podeMovimentar,
  mes,
  onPagar,
  onEditar,
  onExcluir,
}: TabelaDespesasProps) {
  function menu(d: DespesaDto): ItemMenu[] {
    return [
      {
        label: "Excluir",
        tone: "danger",
        onClick: () => {
          onExcluir(d);
        },
      },
    ];
  }

  const colunas: Coluna<DespesaDto>[] = [
    {
      id: "despesa",
      titulo: "Despesa",
      render: (d) => {
        const secundaria = d.recorrente ? "recorrente · mensal" : (d.tituloViagem ?? d.fornecedorNome);
        return (
          <div>
            <div className={s.primary}>{d.descricao}</div>
            {secundaria && <div className={s.secondary}>{secundaria}</div>}
          </div>
        );
      },
    },
    {
      id: "categoria",
      titulo: "Categoria",
      render: (d) => <Badge tone="neutral">{apresentacaoStatus("despesa_categoria", d.categoria).texto}</Badge>,
    },
    { id: "vencimento", titulo: "Vencimento", render: (d) => <DateCell value={d.vencimento} /> },
    {
      id: "situacao",
      titulo: "Situação",
      render: (d) =>
        d.pago ? (
          <Badge tone="success">pago {formatarData(d.pagoEm).slice(0, 5)}</Badge>
        ) : (
          <StatusCell entidade="despesa" valor={d.situacao} />
        ),
    },
    {
      id: "viagem",
      titulo: "Viagem",
      render: (d) =>
        d.viagemId ? (
          <Link to={`/viagens/${d.viagemId}`}>
            <code>{d.codigoViagem}</code>
          </Link>
        ) : (
          "—"
        ),
    },
    { id: "valor", titulo: "Valor", alinhar: "right", render: (d) => <MoneyCell value={d.valor} /> },
    {
      id: "acoes",
      titulo: "",
      alinhar: "right",
      render: (d) => (
        <div className={s.acoes}>
          {podeMovimentar && !d.pago && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onPagar(d);
              }}
            >
              Marcar pago
            </Button>
          )}
          {podeMovimentar && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                onEditar(d);
              }}
            >
              Editar
            </Button>
          )}
          {podeMovimentar && <MenuAcoes label={`Mais ações de ${d.descricao}`} itens={menu(d)} />}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      legenda="Despesas"
      colunas={colunas}
      linhas={itens}
      chave={(d) => d.id}
      carregando={carregando}
      rotuloLinha={(d) => d.descricao}
      vazio={
        <EmptyState
          title={`Nenhuma despesa em ${nomeMes(mes)}`}
          description="Lance a primeira despesa do mês ou troque o mês."
        />
      }
    />
  );
}
