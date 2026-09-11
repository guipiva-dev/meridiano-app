import { Link } from "react-router";
import type { DocumentoVencendoDto } from "@/api/agenda";
import { type Coluna, DataTable, DateCell } from "@/components";
import { Badge } from "@/components/display";
import { EmptyState } from "@/components/feedback";

/** yyyy-mm-dd → dd/mm (sem ano, como no protótipo "Lisboa · 18/04"). */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function tituloDocumento(d: DocumentoVencendoDto): string {
  const tipo = d.tipo.charAt(0).toUpperCase() + d.tipo.slice(1);
  return d.numero ? `${tipo} ${d.numero}` : `${tipo} não cadastrado`;
}

function validadeTexto(d: DocumentoVencendoDto): string {
  if (!d.validade || d.diasParaVencer === null) return "não cadastrado";
  return d.diasParaVencer < 0 ? `vencido há ${Math.abs(d.diasParaVencer)} dias` : `${d.diasParaVencer} dias`;
}

const COLUNAS: Coluna<DocumentoVencendoDto>[] = [
  { id: "pessoa", titulo: "Pessoa", render: (d) => d.clienteNome },
  { id: "documento", titulo: "Documento", render: tituloDocumento },
  {
    id: "validade",
    titulo: "Validade",
    render: (d) => (
      <>
        <DateCell value={d.validade} /> {d.validade && `· ${validadeTexto(d)}`}
      </>
    ),
  },
  {
    id: "proximaViagem",
    titulo: "Próxima viagem",
    render: (d) =>
      d.proximaViagemDestino && d.proximaViagemIda ? `${d.proximaViagemDestino} · ${diaMes(d.proximaViagemIda)}` : "—",
  },
  {
    id: "pendencia",
    titulo: "Pendência",
    render: (d) => (
      <Badge tone={d.situacao === "na_agenda" ? "info" : "neutral"}>
        {d.situacao === "na_agenda" ? "na agenda" : "só no cadastro"}
      </Badge>
    ),
  },
  {
    id: "abrir",
    titulo: "",
    render: (d) => <Link to={`/clientes/${d.clienteId}`}>Abrir</Link>,
  },
];

export function DocumentosTab({ documentos }: { documentos: DocumentoVencendoDto[] }) {
  return (
    <DataTable
      legenda="Documentos vencendo"
      colunas={COLUNAS}
      linhas={documentos}
      chave={(d) => `${d.clienteId}-${d.tipo}`}
      vazio={<EmptyState title="Nenhum documento vencendo" description="Passaportes e vistos aparecem aqui." />}
    />
  );
}
