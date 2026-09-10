import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";
import { RotaProtegida } from "@/shell/RotaProtegida";

export function RotasGrupos() {
  return (
    <Route element={<RotaProtegida permissao="cliente.ver" />}>
      <Route path="/clientes/grupos" element={<EmConstrucao titulo="Grupos" />} />
      <Route path="/clientes/grupos/nova" element={<EmConstrucao titulo="Novo grupo" />} />
      <Route path="/clientes/grupos/:id" element={<EmConstrucao titulo="Grupo" />} />
    </Route>
  );
}
