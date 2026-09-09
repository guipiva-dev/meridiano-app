import { Navigate, Route } from "react-router";
import { NovaViagemPage } from "@/pages/viagens/NovaViagemPage";
import { AppShell } from "./AppShell";
import { EmConstrucao } from "./EmConstrucao";

export function RotasApp() {
  return (
    <Route element={<AppShell />}>
      <Route index element={<Navigate to="/viagens" replace />} />
      <Route path="/viagens" element={<EmConstrucao titulo="Viagens" />} />
      <Route path="/viagens/nova" element={<NovaViagemPage />} />
      <Route path="/viagens/:id" element={<EmConstrucao titulo="Viagem" />} />
      <Route path="/viagens/:id/editar" element={<NovaViagemPage />} />
      <Route path="/clientes" element={<EmConstrucao titulo="Clientes" />} />
      <Route path="/clientes/grupos" element={<EmConstrucao titulo="Grupos" />} />
      <Route path="/fornecedores" element={<EmConstrucao titulo="Fornecedores" />} />
      <Route path="/financeiro" element={<EmConstrucao titulo="Conciliação" />} />
      <Route path="/financeiro/repasses" element={<EmConstrucao titulo="Repasses" />} />
      <Route path="/financeiro/despesas" element={<EmConstrucao titulo="Despesas" />} />
      <Route path="/financeiro/fechamento" element={<EmConstrucao titulo="Fechamento" />} />
      <Route path="/agenda" element={<EmConstrucao titulo="Agenda" />} />
      <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />
      <Route path="/equipe" element={<EmConstrucao titulo="Equipe" />} />
      <Route path="/auditoria" element={<EmConstrucao titulo="Auditoria" />} />
      <Route
        path="*"
        element={
          <EmConstrucao
            titulo="Página não encontrada"
            descricao="Endereço não existe. Confira o link ou volte para Viagens."
          />
        }
      />
    </Route>
  );
}
