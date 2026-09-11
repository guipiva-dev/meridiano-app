import { useNavigate } from "react-router";
import type { ViagemDaPessoaDto } from "@/api/clientes";
import { type Coluna, DataTable, MoneyCell, StatusCell } from "@/components";
import { formatarPeriodo } from "@/lib/datas";
import s from "./Pessoa.module.css";

const ROTULO_TIPO: Record<ViagemDaPessoaDto["tipo"], string> = { nacional: "Nacional", internacional: "Internacional" };

export function ViagensPessoa({ viagens }: { viagens: ViagemDaPessoaDto[] }) {
  const nav = useNavigate();
  // Sem `reserva.ver_valores` o backend omite `vendaTotal`; a coluna some junto.
  const mostrarValores = viagens[0]?.vendaTotal !== undefined;

  const colunas: Coluna<ViagemDaPessoaDto>[] = [
    {
      id: "viagem",
      titulo: "Viagem",
      render: (v) => (
        <div>
          <div className={s.primary}>{v.destino}</div>
          <div className={s.secondary}>
            {ROTULO_TIPO[v.tipo]} · <code className={s.mono}>{v.codigo}</code>
          </div>
        </div>
      ),
    },
    { id: "periodo", titulo: "Período", render: (v) => formatarPeriodo(v.dataIda, v.dataVolta) },
    { id: "papel", titulo: "Papel", render: (v) => (v.titular ? "titular" : "passageira") },
    { id: "fase", titulo: "Fase", render: (v) => <StatusCell entidade="fase_viagem" valor={v.faseOperacional} /> },
    {
      id: "financeiro",
      titulo: "Financeiro",
      render: (v) => <StatusCell entidade="comissao" valor={v.faseFinanceira} />,
    },
  ];
  if (mostrarValores) {
    colunas.push({
      id: "vendido",
      titulo: "Vendido",
      alinhar: "right",
      render: (v) => <MoneyCell value={v.vendaTotal} />,
    });
  }

  return (
    <DataTable
      legenda="Viagens da pessoa"
      colunas={colunas}
      linhas={viagens}
      chave={(v) => v.id}
      rotuloLinha={(v) => `Abrir viagem ${v.codigo}`}
      onLinha={(v) => {
        void nav(`/viagens/${v.id}`);
      }}
      vazio="Nenhuma viagem ainda"
    />
  );
}
