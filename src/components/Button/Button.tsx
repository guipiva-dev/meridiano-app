import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./Button.module.css";

export type ButtonVariant = "business" | "primary" | "secondary" | "tertiary" | "danger";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant: ButtonVariant;
  size?: "md" | "sm";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant,
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(s.button, s[variant], size === "sm" && s.sm, className)}
      disabled={disabled ? true : loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={s.spinner} aria-hidden /> : icon}
      {children}
    </button>
  );
}
