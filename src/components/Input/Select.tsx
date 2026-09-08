import { forwardRef, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

export interface SelectOption {
  value: string;
  label: string;
}
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className, ...rest },
  ref,
) {
  const f = useField();
  return (
    <select
      ref={ref}
      id={f?.id}
      aria-describedby={f?.describedBy}
      aria-invalid={f?.invalid ? true : undefined}
      required={f?.required}
      className={cx(s.control, className)}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});
