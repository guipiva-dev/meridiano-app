import { forwardRef, type InputHTMLAttributes } from "react";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "type"> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, ...rest }, ref) {
  const f = useField();
  return (
    <label className={s.check}>
      <input ref={ref} id={f?.id} aria-describedby={f?.describedBy} required={f?.required} type="radio" {...rest} />
      {label}
    </label>
  );
});
