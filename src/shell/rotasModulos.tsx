import { Navigate, Route } from "react-router";
import { ViagemPage } from "@/pages/viagens/detalhe/ViagemPage";
import { ViagensPage } from "@/pages/viagens/lista/ViagensPage";
import { NovaViagemPage } from "@/pages/viagens/NovaViagemPage";
import { AppShell } from "./AppShell";
import { EmConstrucao } from "./EmConstrucao";
import { RotaProtegida } from "./RotaProtegida";
import { RotasAgenda } from "./rotasAgenda";
import { RotasAuditoria } from "./rotasAuditoria";
import { RotasCadastros } from "./rotasCadastros";
import { RotasEquipe } from "./rotasEquipe";
import { RotasFinanceiro } from "./rotasFinanceiro";
import { RotasRelatorios } from "./rotasRelatorios";

export function RotasApp() {
  return (
    <Route element={<AppShell />}>
      <Route index element={<Navigate to="/viagens" replace />} />
      <Route element={<RotaProtegida permissao={["viagem.ver", "viagem.ver_proprias"]} />}>
        <Route path="/viagens" element={<ViagensPage />} />
        <Route path="/viagens/nova" element={<NovaViagemPage />} />
        <Route path="/viagens/:id" element={<ViagemPage />} />
        <Route path="/viagens/:id/editar" element={<NovaViagemPage />} />
      </Route>
      {RotasCadastros()}
      {RotasFinanceiro()}
      {RotasAgenda()}
      {RotasRelatorios()}
      {RotasEquipe()}
      {RotasAuditoria()}
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
