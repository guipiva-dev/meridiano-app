import { useState } from "react";
import { useNavigate } from "react-router";
import type { CreditoDto, ReservaDto, ViagemDto } from "@/api/viagens";
import { Button } from "@/components";
import { Alert } from "@/components/display";
import { ReservaDetalheCard } from "@/components/reserva";
import { formatarDinheiro } from "@/lib/dinheiro";
import type { ModalViagem } from "./useViagem";
import s from "./Viagem.module.css";

interface ReservasTabProps {
  viagem: ViagemDto;
  creditos: CreditoDto[];
  verValores: boolean;
  podeEditar: boolean;
  reservaAberta: string | undefined;
  abrir: (m: ModalViagem) => void;
}

export function ReservasTab({ viagem, creditos, verValores, podeEditar, reservaAberta, abrir }: ReservasTabProps) {
  const nav = useNavigate();
  const [abertas, setAbertas] = useState<string[]>(reservaAberta ? [reservaAberta] : []);
  const disponiveis = creditos.filter((c) => c.status === "disponivel");

  // Ordem de leitura: ativas primeiro, canceladas no fim; o índice mostrado é o da viagem.
  const ordenadas = viagem.reservas
    .map((reserva, indice) => ({ reserva, indice: indice + 1 }))
    .sort((a, b) => Number(a.reserva.status === "cancelada") - Number(b.reserva.status === "cancelada"));

  function alternar(reserva: ReservaDto) {
    setAbertas((atuais) =>
      atuais.includes(reserva.id) ? atuais.filter((x) => x !== reserva.id) : [...atuais, reserva.id],
    );
  }

  return (
    <div className={s.reservas}>
      {disponiveis.length > 0 && (
        <Alert
          tone="info"
          action={
            podeEditar && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  abrir({ tipo: "usarCredito" });
                }}
              >
                Usar crédito…
              </Button>
            )
          }
        >
          Crédito disponível: {disponiveis.length} ·{" "}
          {formatarDinheiro(disponiveis.reduce((total, c) => total + c.valor, 0))}
        </Alert>
      )}

      {ordenadas.map(({ reserva, indice }) => (
        <ReservaDetalheCard
          key={reserva.id}
          indice={indice}
          reserva={reserva}
          verValores={verValores}
          podeEditar={podeEditar && !viagem.cancelada}
          aberta={abertas.includes(reserva.id)}
          onToggle={() => {
            alternar(reserva);
          }}
          onEditar={() => {
            void nav(`/viagens/${viagem.id}/editar?reserva=${reserva.id}`);
          }}
          onRemarcar={() => {
            abrir({ tipo: "remarcar", reserva });
          }}
          onCancelar={() => {
            abrir({ tipo: "cancelarReserva", reserva });
          }}
          onNfse={() => {
            abrir({ tipo: "nfse", reserva });
          }}
        />
      ))}

      {podeEditar && !viagem.cancelada && (
        <div>
          <Button
            variant="business"
            onClick={() => {
              void nav(`/viagens/${viagem.id}/editar`);
            }}
          >
            + Adicionar reserva
          </Button>
        </div>
      )}
    </div>
  );
}
