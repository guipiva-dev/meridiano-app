import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

export function RotasEquipePagina() {
  return (
    <>
      <Route path="/equipe" element={<EmConstrucao titulo="Equipe" />} />
      <Route path="/equipe/nova" element={<EmConstrucao titulo="Colaborador" />} />
      <Route path="/equipe/:id" element={<EmConstrucao titulo="Colaborador" />} />
    </>
  );
}
