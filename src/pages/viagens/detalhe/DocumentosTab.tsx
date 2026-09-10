import type { ViagemDto } from "@/api/viagens";
import { ListaAnexos } from "@/components/anexos";
import { DocumentosDosPassageiros } from "@/components/Cadastros/pessoa/DocumentosDosPassageiros";
import s from "@/components/Cadastros/pessoa/Pessoa.module.css";

/** Anexos da viagem/reservas + documentos dos passageiros, em leitura (R11). */
export function DocumentosTab({ viagem, podeEnviar }: { viagem: ViagemDto; podeEnviar: boolean }) {
  return (
    <div className={s.painel}>
      <ListaAnexos viagemId={viagem.id} reservas={viagem.reservas} podeEnviar={podeEnviar} />
      <DocumentosDosPassageiros passageiros={viagem.passageiros} />
    </div>
  );
}
