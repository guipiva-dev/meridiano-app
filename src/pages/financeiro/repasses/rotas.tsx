import { Route } from "react-router";
import { RepassesPage } from "./RepassesPage";

export function RotasRepasses() {
  return <Route path="/financeiro/repasses" element={<RepassesPage />} />;
}
