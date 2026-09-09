import type { CreditoDto, VendedorDto, ViagemDto } from "@/api/viagens";
import {
  CancelarReservaModal,
  CancelarViagemModal,
  NfseModal,
  RemarcarModal,
  TransferirModal,
  UsarCreditoModal,
} from "@/components/viagemOperacoes";
import type { ModalViagem } from "./useViagem";

interface ModaisViagemProps {
  modal: ModalViagem | null;
  viagem: ViagemDto;
  vendedores: VendedorDto[];
  creditos: CreditoDto[];
  aplicar: (dto: ViagemDto) => void;
  recarregar: () => void;
  fechar: () => void;
}

/**
 * Cada modal semeia o estado a partir das props na montagem — por isso são montados
 * condicionalmente, nunca permanentemente.
 */
export function ModaisViagem({ modal, viagem, vendedores, creditos, aplicar, recarregar, fechar }: ModaisViagemProps) {
  const comum = { open: true as const, viagem, onClose: fechar, onRecarregar: recarregar };
  switch (modal?.tipo) {
    case "cancelarReserva":
      return <CancelarReservaModal {...comum} reserva={modal.reserva} onCancelada={aplicar} />;
    case "remarcar":
      return <RemarcarModal {...comum} reserva={modal.reserva} onRemarcada={aplicar} />;
    case "nfse":
      return <NfseModal {...comum} reserva={modal.reserva} onSalva={aplicar} />;
    case "cancelarViagem":
      return <CancelarViagemModal {...comum} onCancelada={aplicar} />;
    case "transferir":
      return <TransferirModal {...comum} vendedores={vendedores} onTransferida={aplicar} />;
    case "usarCredito":
      return <UsarCreditoModal {...comum} creditos={creditos} onUsado={aplicar} />;
    default:
      return null;
  }
}
