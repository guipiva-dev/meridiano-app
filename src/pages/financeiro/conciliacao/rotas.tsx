import { Route } from "react-router";
import { ConciliacaoPage } from "./ConciliacaoPage";

export function RotasConciliacao() {
  return <Route path="/financeiro" element={<ConciliacaoPage />} />;
}
