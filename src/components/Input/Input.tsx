import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "size"> {
  calculated?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { calculated, readOnly, className, ...rest },
  ref,
) {
  const f = useField();
  return (
    <input
      ref={ref}
      id={f?.id}
      aria-describedby={f?.describedBy}
      aria-invalid={f?.invalid ? true : undefined}
      required={f?.required}
      readOnly={readOnly}
      className={cx(s.control, calculated && s.calculated, readOnly && s.readOnly, className)}
      {...rest}
    />
  );
});
