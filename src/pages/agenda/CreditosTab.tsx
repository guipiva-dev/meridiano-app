import { Link } from "react-router";
import type { CreditoVencendoDto } from "@/api/agenda";
import { type Coluna, DataTable, MoneyCell } from "@/components";
import { EmptyState } from "@/components/feedback";

/** yyyy-mm-dd → "mm/yyyy". */
function mesAno(iso: string): string {
  return `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

const COLUNAS: Coluna<CreditoVencendoDto>[] = [
  { id: "pessoa", titulo: "Pessoa", render: (c) => c.clienteNome },
  { id: "operadora", titulo: "Operadora", render: (c) => c.fornecedorNome },
  { id: "origem", titulo: "Origem", render: (c) => c.origem },
  {
    id: "validade",
    titulo: "Validade",
    render: (c) => `${mesAno(c.validade)} · ${Math.round(c.diasParaVencer / 30)} meses`,
  },
  { id: "valor", titulo: "Valor", alinhar: "right", render: (c) => <MoneyCell value={c.valor} /> },
  { id: "abrir", titulo: "", render: (c) => <Link to={`/clientes/${c.clienteId}`}>Abrir</Link> },
];

export function CreditosTab({ creditos }: { creditos: CreditoVencendoDto[] }) {
  return (
    <DataTable
      legenda="Créditos vencendo"
      colunas={COLUNAS}
      linhas={creditos}
      chave={(c) => c.creditoId}
      vazio={<EmptyState title="Nenhum crédito vencendo" description="Créditos de cancelamento aparecem aqui." />}
    />
  );
}
