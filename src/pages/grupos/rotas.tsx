import { Route } from "react-router";
import { RotaProtegida } from "@/shell/RotaProtegida";
import { GrupoPage } from "./GrupoPage";
import { GruposPage } from "./GruposPage";

export function RotasGrupos() {
  return (
    <Route element={<RotaProtegida permissao="cliente.ver" />}>
      <Route path="/clientes/grupos" element={<GruposPage />} />
      <Route path="/clientes/grupos/nova" element={<GrupoPage />} />
      <Route path="/clientes/grupos/:id" element={<GrupoPage />} />
    </Route>
  );
}
