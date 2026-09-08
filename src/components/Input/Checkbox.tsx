import { forwardRef, type InputHTMLAttributes } from "react";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, ...rest }, ref) {
  const f = useField();
  return (
    <label className={s.check}>
      <input
        ref={ref}
        id={f?.id}
        aria-describedby={f?.describedBy}
        aria-invalid={f?.invalid ? true : undefined}
        required={f?.required}
        type="checkbox"
        {...rest}
      />
      {label}
    </label>
  );
});
