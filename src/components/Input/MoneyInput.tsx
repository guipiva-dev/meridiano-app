import { type FocusEvent, forwardRef, type InputHTMLAttributes, useState } from "react";
import { cx } from "@/lib/cx";
import { formatarDinheiro, parsearDinheiro } from "@/lib/dinheiro";
import { useField } from "../Field/FieldContext";
import s from "./Input.module.css";

export interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (valor: number | null) => void;
  calculated?: boolean;
  allowNegative?: boolean;
}

function cru(v: number | null) {
  return v === null ? "" : v.toFixed(2).replace(".", ",");
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, calculated, allowNegative = false, readOnly, className, onFocus, onBlur, ...rest },
  ref,
) {
  const f = useField();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  function focar(e: FocusEvent<HTMLInputElement>) {
    setTexto(cru(value));
    setEditando(true);
    requestAnimationFrame(() => {
      e.target.select();
    });
    onFocus?.(e);
  }
  function sair(e: FocusEvent<HTMLInputElement>) {
    let n = parsearDinheiro(texto);
    if (n !== null && !allowNegative && n < 0) n = Math.abs(n);
    if (n !== value) onChange(n);
    setEditando(false);
    onBlur?.(e);
  }

  return (
    <div className={s.wrap}>
      <input
        ref={ref}
        id={f?.id}
        aria-describedby={f?.describedBy}
        aria-invalid={f?.invalid ? true : undefined}
        required={f?.required}
        inputMode="decimal"
        readOnly={readOnly}
        value={editando ? texto : formatarDinheiro(value)}
        onChange={(e) => {
          setTexto(e.target.value);
        }}
        onFocus={focar}
        onBlur={sair}
        className={cx(s.control, s.money, calculated && s.calculated, readOnly && s.readOnly, className)}
        {...rest}
      />
      {calculated && !editando && (
        <span className={s.calcBadge} aria-hidden>
          calculado
        </span>
      )}
    </div>
  );
});
