import { expect, test } from "@playwright/test";
import { DEV_USER } from "./fixtures";

test("login e navegação pela sidebar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/E-mail/).fill(DEV_USER.email);
  await page.getByLabel(/Senha/).fill(DEV_USER.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/viagens/);
  await page.getByRole("link", { name: /Financeiro/ }).click();
  await expect(page.getByRole("heading", { name: "Comissões a receber" })).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
});

// Cada execução conta como falha de login no back (bloqueio após 5 em 15 min para o e-mail). Não há
// helper de banco no e2e para limpar `log_acesso`: rodar este spec no máximo 5x em 15 min.
test("senha errada", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/E-mail/).fill(DEV_USER.email);
  await page.getByLabel(/Senha/).fill("errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
});
