import { Route } from "react-router";
import { EmConstrucao } from "@/shell/EmConstrucao";

// Sem RotaProtegida: o GET de fornecedores é aberto a qualquer autenticado (a escrita é que exige permissão).
export function RotasFornecedores() {
  return (
    <>
      <Route path="/fornecedores" element={<EmConstrucao titulo="Fornecedores" />} />
      <Route path="/fornecedores/nova" element={<EmConstrucao titulo="Novo fornecedor" />} />
      <Route path="/fornecedores/:id" element={<EmConstrucao titulo="Fornecedor" />} />
    </>
  );
}
