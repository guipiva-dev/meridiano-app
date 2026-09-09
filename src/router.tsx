import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router";
import { RequireAuth } from "@/auth/RequireAuth";
import { DefinirSenhaPage } from "@/pages/acesso/DefinirSenhaPage";
import { EsqueciSenhaPage } from "@/pages/acesso/EsqueciSenhaPage";
import { LoginPage } from "@/pages/acesso/LoginPage";
import { RedefinirSenhaPage } from "@/pages/acesso/RedefinirSenhaPage";
import { RotasApp } from "@/shell/rotasModulos";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/definir-senha" element={<DefinirSenhaPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route element={<RequireAuth />}>{RotasApp()}</Route>
    </>,
  ),
);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
