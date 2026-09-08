import { CircleHelp } from "lucide-react";
import { type ReactNode, useId } from "react";
import s from "./Field.module.css";
import { FieldContext } from "./FieldContext";

export interface FieldProps {
  label: string;
  required?: boolean;
  helper?: string;
  tooltip?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required = false, helper, tooltip, error, children, className }: FieldProps) {
  const id = useId();
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={[s.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={s.label}>
        {label}
        {required && (
          <span className={s.required} aria-hidden>
            *
          </span>
        )}
        {tooltip && (
          <span className={s.tooltip} title={tooltip} aria-label={tooltip} role="img">
            <CircleHelp size={16} />
          </span>
        )}
      </label>
      <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
        {children}
      </FieldContext.Provider>
      {helper && !error && (
        <span id={helperId} className={s.helper}>
          {helper}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className={s.error}>
          {error}
        </span>
      )}
    </div>
  );
}
