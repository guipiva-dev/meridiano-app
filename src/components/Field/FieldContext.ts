import { createContext, useContext } from "react";

export interface FieldInfo {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}
export const FieldContext = createContext<FieldInfo | null>(null);
export const useField = () => useContext(FieldContext);
