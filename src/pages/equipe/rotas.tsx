import { Route } from "react-router";
import { ColaboradorPage } from "./ColaboradorPage";
import { EquipePage } from "./EquipePage";

export function RotasEquipePagina() {
  return (
    <>
      <Route path="/equipe" element={<EquipePage />} />
      <Route path="/equipe/nova" element={<ColaboradorPage />} />
      <Route path="/equipe/:id" element={<ColaboradorPage />} />
    </>
  );
}
