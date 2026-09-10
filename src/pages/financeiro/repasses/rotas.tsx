import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasRepasses() {
  return <Route path="/financeiro/repasses" element={<EmConstrucao titulo="Repasses" />} />;
}
