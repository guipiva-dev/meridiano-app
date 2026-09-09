import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth fora de AuthProvider");
  return v;
}
