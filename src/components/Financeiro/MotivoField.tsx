import { Field, Textarea } from "@/components";

interface MotivoFieldProps {
  value: string;
  onChange: (v: string) => void;
  erro?: string;
  /** X02: a divergência não é "período fechado ou exclusão" — hint mais curto e específico. */
  helper?: string;
}

export function MotivoField({
  value,
  onChange,
  erro,
  helper = "Período fechado ou exclusão: o motivo vai para a auditoria.",
}: MotivoFieldProps) {
  return (
    <Field label="Motivo" required helper={helper} error={erro}>
      <Textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </Field>
  );
}
