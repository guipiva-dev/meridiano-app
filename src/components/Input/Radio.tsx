import { forwardRef, type InputHTMLAttributes } from "react";
import s from "./Input.module.css";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "type"> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, ...rest }, ref) {
  return (
    <label className={s.check}>
      <input ref={ref} type="radio" {...rest} />
      {label}
    </label>
  );
});
