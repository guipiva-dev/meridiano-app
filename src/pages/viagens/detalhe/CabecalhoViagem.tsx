import { useNavigate } from "react-router";
import type { ViagemDto } from "@/api/viagens";
import { Button } from "@/components";
import { Alert, Badge, StatusBadge } from "@/components/display";
import { PageHeader } from "@/components/shell";
import { formatarData, formatarPeriodo } from "@/lib/datas";
import s from "./Viagem.module.css";

const ROTULO_TIPO = { nacional: "Nacional", internacional: "Internacional" };

function titularDa(viagem: ViagemDto): string {
  return viagem.passageiros.find((p) => p.titular)?.nome ?? viagem.passageiros[0]?.nome ?? "Sem titular";
}

interface CabecalhoViagemProps {
  viagem: ViagemDto;
  pode: (permissao: string) => boolean;
  onTransferir: () => void;
  onCancelar: () => void;
}

export function CabecalhoViagem({ viagem, pode, onTransferir, onCancelar }: CabecalhoViagemProps) {
  const nav = useNavigate();
  const n = viagem.passageiros.length;
  const subtitle = [
    formatarPeriodo(viagem.dataIda, viagem.dataVolta),
    ROTULO_TIPO[viagem.tipo],
    `${n} ${n === 1 ? "passageiro" : "passageiros"}`,
    `Vendedor(a): ${viagem.vendedorNome}`,
    `Agente: ${viagem.agenteNome ?? "—"}`,
  ].join(" · ");

  return (
    <>
      <PageHeader
        title={`${titularDa(viagem)} · ${viagem.destino}`}
        subtitle={subtitle}
        meta={
          <Badge tone="neutral">
            <code className={s.codigo}>{viagem.codigo}</code>
          </Badge>
        }
        status={
          <>
            <StatusBadge entidade="fase_viagem" valor={viagem.faseOperacional} />
            <StatusBadge entidade="comissao" valor={viagem.faseFinanceira} />
          </>
        }
        actions={
          <>
            {pode("viagem.transferir") && (
              <Button variant="secondary" onClick={onTransferir}>
                Transferir
              </Button>
            )}
            {pode("viagem.editar") && !viagem.cancelada && (
              <>
                <Button variant="danger" onClick={onCancelar}>
                  Cancelar viagem…
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    void nav(`/viagens/${viagem.id}/editar`);
                  }}
                >
                  Editar
                </Button>
              </>
            )}
          </>
        }
      />
      {viagem.cancelada && (
        <Alert tone="danger">
          Viagem cancelada em {formatarData(viagem.canceladaEm)}: {viagem.motivoCancelamento ?? "sem motivo registrado"}
        </Alert>
      )}
    </>
  );
}
