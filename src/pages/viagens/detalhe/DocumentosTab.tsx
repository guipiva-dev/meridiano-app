import type { ViagemDto } from "@/api/viagens";
import { ListaAnexos } from "@/components/anexos";

/** Só anexos da viagem/reservas; documentos dos passageiros ficam para a fase 3.4. */
export function DocumentosTab({ viagem, podeEnviar }: { viagem: ViagemDto; podeEnviar: boolean }) {
  return <ListaAnexos viagemId={viagem.id} reservas={viagem.reservas} podeEnviar={podeEnviar} />;
}
