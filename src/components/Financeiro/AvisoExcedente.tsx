import { Checkbox } from "@/components";
import { Alert } from "@/components/display";
import { formatarDinheiro } from "@/lib/dinheiro";

interface AvisoExcedenteProps {
  /** R$ acima do esperado; nada é renderizado quando null ou <= 0. */
  excedente: number | null;
  confirmado: boolean;
  onChange: (confirmado: boolean) => void;
}

/** Aviso "R$ X acima do esperado" + "Registrar mesmo assim", que libera `confirmarExcedente` no request. */
export function AvisoExcedente({ excedente, confirmado, onChange }: AvisoExcedenteProps) {
  if (excedente === null || excedente <= 0) return null;
  return (
    <Alert tone="neutral">
      <p>{formatarDinheiro(excedente)} acima do esperado</p>
      <Checkbox
        label="Registrar mesmo assim"
        checked={confirmado}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
      />
    </Alert>
  );
}
