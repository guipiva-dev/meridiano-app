import type { ReactNode } from "react";
import type { Tone } from "@/dominio/status";
import { cx } from "@/lib/cx";
import s from "./Badge.module.css";

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cx(s.badge, s[tone], className)}>{children}</span>;
}
