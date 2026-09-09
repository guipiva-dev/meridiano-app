import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "type"> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, ...rest }, ref) {
  const f = useField();
  const uid = useId();
  return (
    <label className={s.check}>
      <input ref={ref} id={uid} aria-describedby={f?.describedBy} required={f?.required} type="radio" {...rest} />
      {label}
    </label>
  );
});
