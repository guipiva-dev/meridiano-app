import { ROTULO_SERVICO, TIPOS_SERVICO, type TipoServico } from "@/api/viagens";
import { Chip } from "@/components/display";
import s from "./Reserva.module.css";

interface ServiceChipsProps {
  value: TipoServico[];
  onChange: (v: TipoServico[]) => void;
}

export function ServiceChips({ value, onChange }: ServiceChipsProps) {
  function alternar(tipo: TipoServico) {
    onChange(value.includes(tipo) ? value.filter((t) => t !== tipo) : [...value, tipo]);
  }
  return (
    <div role="group" aria-label="Serviços vendidos" className={s.chips}>
      {TIPOS_SERVICO.map((tipo) => (
        <Chip
          key={tipo}
          selected={value.includes(tipo)}
          onClick={() => {
            alternar(tipo);
          }}
        >
          {ROTULO_SERVICO[tipo]}
        </Chip>
      ))}
    </div>
  );
}
