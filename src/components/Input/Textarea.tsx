import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  /** Marca inválido fora de um `Field` (modal de motivo, por exemplo). Dentro do `Field`, o erro dele já basta. */
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, rows = 3, className, ...rest },
  ref,
) {
  const f = useField();
  return (
    <textarea
      ref={ref}
      id={f?.id}
      rows={rows}
      aria-describedby={f?.describedBy}
      aria-invalid={invalid || f?.invalid ? true : undefined}
      required={f?.required}
      className={cx(s.control, s.textarea, className)}
      {...rest}
    />
  );
});
