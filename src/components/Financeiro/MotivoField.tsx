import { Field, Textarea } from "@/components";

interface MotivoFieldProps {
  value: string;
  onChange: (v: string) => void;
  erro?: string;
}

export function MotivoField({ value, onChange, erro }: MotivoFieldProps) {
  return (
    <Field label="Motivo" required helper="Período fechado ou exclusão: o motivo vai para a auditoria." error={erro}>
      <Textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </Field>
  );
}
