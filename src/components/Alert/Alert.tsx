import { AlertTriangle, CircleCheck, Info, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "@/dominio/status";
import { cx } from "@/lib/cx";
import s from "./Alert.module.css";

const icones = { info: Info, success: CircleCheck, warning: AlertTriangle, danger: OctagonAlert, neutral: Info };

interface AlertProps {
  tone: Tone;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Alert({ tone, title, action, children }: AlertProps) {
  const Icone = icones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx(s.alert, s[tone])}>
      <Icone className={s.icon} aria-hidden />
      <div className={s.body}>
        {title && <strong className={s.title}>{title}</strong>}
        <div>{children}</div>
      </div>
      {action}
    </div>
  );
}
