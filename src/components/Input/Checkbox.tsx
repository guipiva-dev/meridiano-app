import { forwardRef, type InputHTMLAttributes } from "react";
import s from "./Input.module.css";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, ...rest }, ref) {
  return (
    <label className={s.check}>
      <input ref={ref} type="checkbox" {...rest} />
      {label}
    </label>
  );
});
