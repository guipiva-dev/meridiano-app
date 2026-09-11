import { Route } from "react-router";
import { FornecedoresPage } from "./FornecedoresPage";
import { FornecedorPage } from "./FornecedorPage";

// Sem RotaProtegida: o GET de fornecedores é aberto a qualquer autenticado (a escrita é que exige permissão).
export function RotasFornecedores() {
  return (
    <>
      <Route path="/fornecedores" element={<FornecedoresPage />} />
      <Route path="/fornecedores/nova" element={<FornecedorPage />} />
      <Route path="/fornecedores/:id" element={<FornecedorPage />} />
    </>
  );
}
