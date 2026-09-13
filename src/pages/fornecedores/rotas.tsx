import { Route } from "react-router";
import { RotaProtegida } from "@/shell/RotaProtegida";
import { FornecedoresPage } from "./FornecedoresPage";
import { FornecedorPage } from "./FornecedorPage";

// P01: o vendedor externo não tem `fornecedor.ver` — nem lista nem cadastro aparecem para ele.
export function RotasFornecedores() {
  return (
    <Route element={<RotaProtegida permissao="fornecedor.ver" />}>
      <Route path="/fornecedores" element={<FornecedoresPage />} />
      <Route path="/fornecedores/nova" element={<FornecedorPage />} />
      <Route path="/fornecedores/:id" element={<FornecedorPage />} />
    </Route>
  );
}
