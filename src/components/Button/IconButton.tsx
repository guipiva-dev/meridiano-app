import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./Button.module.css";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "children"> {
  label: string;
  icon: ReactNode;
  variant?: "secondary" | "tertiary";
}

export function IconButton({
  label,
  icon,
  variant = "tertiary",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(s.button, s[variant], s.iconOnly, className)}
      {...rest}
    >
      {icon}
    </button>
  );
}
