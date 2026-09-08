import { forwardRef } from "react";
import { Input, type InputProps } from "./Input";

export const DateInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(function DateInput(props, ref) {
  return <Input ref={ref} type="date" {...props} />;
});
