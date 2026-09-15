import { Link, useNavigate } from "react-router";
import type { ViagemDto } from "@/api/viagens";
import { Button } from "@/components";
import { Alert, Badge, StatusBadge } from "@/components/display";
import { type ItemMenu, MenuAcoes } from "@/components/Menu/MenuAcoes";
import { PageHeader } from "@/components/shell";
import { apresentacaoStatus } from "@/dominio/status";
import { formatarCarimbo, formatarPeriodo } from "@/lib/datas";
import { plural } from "@/lib/plural";
import c from "./CabecalhoViagem.module.css";
import s from "./Viagem.module.css";

const ROTULO_TIPO = { nacional: "Nacional", internacional: "Internacional" };
const TOOLTIP_COMISSAO = "Situação da comissão dos fornecedores nas reservas ativas";

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
  const comissao = apresentacaoStatus("comissao", viagem.faseFinanceira);
  // A24: `sem_reserva` é uma fase só, mas "nunca teve reserva" (Rascunho) e "só reservas
  // canceladas" (Sem reserva ativa) contam histórias diferentes — a viagem tem reservas.
  const semReservaAtiva = viagem.faseOperacional === "sem_reserva" && viagem.reservas.length > 0;
  const subtitle = [
    formatarPeriodo(viagem.dataIda, viagem.dataVolta),
    ROTULO_TIPO[viagem.tipo],
    plural(viagem.passageiros.length, "passageiro", "passageiros"),
    `Vendedor: ${viagem.vendedorNome}`,
    `Agente: ${viagem.agenteNome ?? "—"}`,
  ].join(" · ");

  const podeEditar = pode("viagem.editar") && !viagem.cancelada;
  const itens: ItemMenu[] = [
    ...(pode("viagem.transferir") && !viagem.cancelada ? [{ label: "Transferir", onClick: onTransferir }] : []),
    ...(podeEditar ? [{ label: "Cancelar viagem…", onClick: onCancelar, tone: "danger" as const }] : []),
  ];

  return (
    <>
      <nav aria-label="Trilha" className={c.trilha}>
        <Link to="/viagens">Viagens</Link>
        <span aria-hidden>/</span>
        <span>{viagem.codigo}</span>
      </nav>
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
            {semReservaAtiva ? (
              <Badge tone="neutral">Sem reserva ativa</Badge>
            ) : (
              <StatusBadge entidade="fase_viagem" valor={viagem.faseOperacional} />
            )}
            <span title={TOOLTIP_COMISSAO}>
              <Badge tone={comissao.tone}>{`Comissão: ${comissao.texto}`}</Badge>
            </span>
          </>
        }
        actions={
          <>
            <MenuAcoes label="Mais ações" itens={itens} />
            {podeEditar && (
              <Button
                variant="business"
                onClick={() => {
                  void nav(`/viagens/${viagem.id}/editar`);
                }}
              >
                Editar
              </Button>
            )}
          </>
        }
      />
      {viagem.cancelada && (
        <Alert tone="danger">
          Viagem cancelada em {formatarCarimbo(viagem.canceladaEm)}:{" "}
          {viagem.motivoCancelamento ?? "sem motivo registrado"}
        </Alert>
      )}
    </>
  );
}
